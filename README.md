# PES Arena

PES Arena là gaming hub/PWA riêng cho nhóm bạn chơi PES/eFootball: quản lý người chơi và đội bóng, tạo trận 1v1/2v2, random đội, lưu kết quả, thống kê, giải đấu và gửi drama lên Discord.

Phase 1 hiện đã có nền tảng Next.js, PostgreSQL/Drizzle, migration, seed 74 đội, giao diện dark-first và CRUD cho Người chơi, Đội bóng, Nhóm đội. Các route của phase sau đang hiển thị trạng thái phát triển thay vì mock dữ liệu.

## Tech stack

- Next.js 16 App Router, React 19, TypeScript strict
- Tailwind CSS 4, shadcn/ui (Radix), Lucide Icons, Motion
- PostgreSQL, Drizzle ORM/Kit, Neon serverless driver, Zod
- Vitest
- Vercel + Vercel Cron (Phase 4)
- Discord Webhook (Phase 4)

## Architecture

```text
UI (Server Components + small Client Components)
  → Server Action / Route Handler
  → Service (Zod + business rules)
  → Repository (server-only)
  → Drizzle
  → PostgreSQL
```

Match dùng mô hình mở rộng được:

```text
Match
  ├── Side A ── Players
  └── Side B ── Players
```

Score và football team thuộc Side. `match_side_players` có ràng buộc database để một người không xuất hiện hai lần trong cùng trận. Xem thêm [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) và [docs/IMPLEMENTATION_PLAN.md](docs/IMPLEMENTATION_PLAN.md).

## Local setup

Yêu cầu Node.js 20.9+ (khuyến nghị Node 22).

```bash
npm install
cp .env.example .env.local
```

Điền `DATABASE_URL` trong `.env.local`, sau đó:

```bash
npm run db:migrate
npm run db:seed
npm run dev
```

Mở `http://localhost:3000`.

## Environment variables

| Biến | Bắt buộc | Mục đích |
| --- | --- | --- |
| `DATABASE_URL` | Có | PostgreSQL connection string; nên lấy từ Neon qua Vercel Marketplace |
| `DISCORD_WEBHOOK_URL` | Phase 4 | Discord webhook, chỉ dùng server-side |
| `CRON_SECRET` | Phase 4 | Bảo vệ cron route |
| `NEXT_PUBLIC_APP_URL` | Có khi deploy | URL public của app |

Không commit `.env.local` hoặc secret thật.

## Database and Drizzle

Schema nằm tại `src/db/schema`, migration được commit tại `src/db/migrations`, seed tại `src/db/seed.ts`.

```bash
npm run db:generate  # tạo migration từ schema thay đổi
npm run db:migrate   # áp migration qua DATABASE_URL trong .env.local
npm run db:seed      # seed 74 đội, 4 pool mặc định và app settings
npm run db:studio    # mở Drizzle Studio
```

Seed có tính idempotent: có thể chạy lại mà không nhân đôi đội/pool/thành viên.

## Provision PostgreSQL through Vercel

1. Push project lên Git repository và import vào Vercel.
2. Vào Vercel Project → Storage/Marketplace → chọn Neon Postgres.
3. Kết nối integration với project và các environment mong muốn.
4. Pull env về local bằng Vercel CLI hoặc sao chép connection string vào `.env.local`.
5. Chạy `npm run db:migrate` rồi `npm run db:seed` với production URL đã xác nhận.
6. Redeploy project.

Database client được lazy-init, vì vậy build không crash trước khi Marketplace inject `DATABASE_URL`; các trang dữ liệu sẽ hiển thị hướng dẫn cấu hình khi chưa có kết nối.

## Discord webhook (Phase 4)

Trong Discord: Server Settings → Integrations → Webhooks → New Webhook → Copy Webhook URL. Lưu URL vào `DISCORD_WEBHOOK_URL` của Vercel, không gửi URL từ client và không commit vào Git.

## Vercel Cron (Phase 4)

Weekly report mặc định là Chủ nhật 23:00 Asia/Ho_Chi_Minh, tương ứng `0 16 * * 0` UTC. Cron route sẽ kiểm tra `Authorization: Bearer $CRON_SECRET` và idempotency qua bảng `discord_reports`.

## Quality commands

```bash
npm test
npm run test:coverage
npm run lint
npm run typecheck
npm run build
```

Production build dùng Webpack để tương thích môi trường CI bị hạn chế bind port trong PostCSS; `npm run dev` vẫn dùng Turbopack mặc định của Next.js.

## Current routes

- `/` — Tổng quan Phase 1
- `/players` — CRUD/enable-disable người chơi
- `/teams` — CRUD/enable-disable đội bóng và quản lý pool
- `/matches/new`, `/history` — sẽ triển khai Phase 2
- `/leaderboard`, `/statistics`, `/records` — sẽ triển khai Phase 3
- `/settings` — Discord/cron settings hoàn thiện ở Phase 4
- `/tournaments` — sẽ triển khai Phase 5

## Troubleshooting

- `DATABASE_URL chưa được cấu hình`: kiểm tra `.env.local`, sau đó restart dev server.
- `relation does not exist`: chạy `npm run db:migrate`.
- Trang đội bóng trống: chạy `npm run db:seed`.
- Build không tải được Geist: môi trường build cần truy cập `fonts.googleapis.com`; Vercel hỗ trợ `next/font` mặc định.
- Discord không gửi: kiểm tra webhook còn hoạt động và biến env chỉ nằm server-side.
