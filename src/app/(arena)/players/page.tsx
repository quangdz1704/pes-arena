import type { Metadata } from "next";

import { DatabaseSetupNotice } from "@/components/shared/database-setup-notice";
import { PageHeading } from "@/components/shared/page-heading";
import { isDatabaseConfigured } from "@/db";
import { listPlayers } from "@/services/player.service";

import { AddPlayerButton, PlayerManager } from "./player-manager";

export const metadata: Metadata = { title: "Người chơi" };
export const dynamic = "force-dynamic";

export default async function PlayersPage() {
  const databaseReady = isDatabaseConfigured();
  const players = databaseReady ? await listPlayers() : [];

  return (
    <div className="space-y-7">
      <PageHeading
        eyebrow="Quản lý"
        title="Người chơi"
        description="Danh sách chiến hữu sẽ được dùng xuyên suốt trận đấu, thống kê và giải đấu. Tạm ẩn người nghỉ chơi thay vì xóa lịch sử."
        action={databaseReady ? <AddPlayerButton /> : undefined}
      />
      {databaseReady ? <PlayerManager players={players} /> : <DatabaseSetupNotice />}
    </div>
  );
}
