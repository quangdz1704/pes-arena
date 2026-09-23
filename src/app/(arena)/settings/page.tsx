import { DatabaseSetupNotice } from "@/components/shared/database-setup-notice";
import { PageHeading } from "@/components/shared/page-heading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isDatabaseConfigured } from "@/db";

import { DiscordLeaderboardForm } from "./discord-leaderboard-form";

export default function SettingsPage() {
  return <div className="mx-auto max-w-3xl space-y-7"><PageHeading eyebrow="Quản lý" title="Cài đặt & Discord" description="Gửi BXH cho cả nhóm ngay khi drama còn nóng." />{!isDatabaseConfigured() ? <DatabaseSetupNotice /> : <Card className="border-white/10 bg-card/80"><CardHeader><CardTitle>Gửi bảng xếp hạng</CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-sm text-muted-foreground">Webhook chỉ được dùng trên server. Chọn khoảng thời gian, sau đó gửi top 10 lên Discord.</p><DiscordLeaderboardForm /></CardContent></Card>}</div>;
}
