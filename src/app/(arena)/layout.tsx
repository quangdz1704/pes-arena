import {
  DesktopSidebar,
  MobileBottomNav,
  MobileHeader,
} from "@/components/layout/app-navigation";
import { ArenaNewsMarquee } from "@/components/shared/arena-news-marquee";
import { isDatabaseConfigured } from "@/db";
import { getArenaNews } from "@/services/arena-news.service";

export const dynamic = "force-dynamic";

export default async function ArenaLayout({ children }: LayoutProps<"/">) {
  const news = isDatabaseConfigured() ? await getArenaNews() : [];
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(64,255,141,0.07),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.07),transparent_24%)]">
      <a className="sr-only fixed left-4 top-4 z-[100] rounded-lg bg-primary px-4 py-2 font-bold text-primary-foreground focus:not-sr-only" href="#main-content">
        Bỏ qua điều hướng
      </a>
      <DesktopSidebar />
      <div className="hidden lg:block">
        <ArenaNewsMarquee compact fixed items={news} />
      </div>
      <div className="lg:pt-10">
        <MobileHeader />
        <div className="sticky top-16 z-20 lg:hidden">
          <ArenaNewsMarquee compact items={news} />
        </div>
        <main className="min-h-screen px-4 pb-[calc(7rem+env(safe-area-inset-bottom))] pt-6 sm:px-6 lg:ml-72 lg:px-10 lg:pb-10 lg:pt-10" id="main-content" tabIndex={-1}>
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}
