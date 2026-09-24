import { getDb } from "./index";
import { discordReports, matches, tournaments } from "./schema";

function hasConfirmationFlag() {
  return process.argv.includes("--confirm");
}

async function resetMatchData() {
  if (!hasConfirmationFlag()) {
    throw new Error(
      "Reset bị chặn. Chạy lại với: npm run db:reset-match-data -- --confirm",
    );
  }

  const db = getDb();

  // Trình điều khiển neon-http không hỗ trợ transaction. Xoá phần dữ liệu cốt
  // lõi trước: trận sẽ cascade side, cầu thủ trong trận và ghi chú. Sau đó mới
  // xoá giải để cascade fixture/đối thủ, rồi dọn lịch sử báo cáo Discord.
  await db.delete(matches);
  await db.delete(tournaments);
  await db.delete(discordReports);

  console.info(
    "Đã reset dữ liệu thi đấu: trận đấu, BXH/thống kê phát sinh, giải đấu và lịch sử báo cáo Discord. Người chơi, đội bóng, pool đội và cài đặt được giữ nguyên.",
  );
}

resetMatchData().catch((error: unknown) => {
  console.error("Không thể reset dữ liệu thi đấu.", error);
  process.exitCode = 1;
});
