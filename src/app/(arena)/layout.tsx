import {
  DesktopSidebar,
  MobileBottomNav,
  MobileHeader,
} from "@/components/layout/app-navigation";

export default function ArenaLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_right,rgba(64,255,141,0.07),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(59,130,246,0.07),transparent_24%)]">
      <DesktopSidebar />
      <MobileHeader />
      <main className="min-h-screen px-4 pb-28 pt-6 sm:px-6 lg:ml-72 lg:px-10 lg:pb-10 lg:pt-10">
        <div className="mx-auto w-full max-w-7xl">{children}</div>
      </main>
      <MobileBottomNav />
    </div>
  );
}
