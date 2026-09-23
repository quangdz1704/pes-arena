import { DatabaseZap } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

export function DatabaseSetupNotice() {
  return (
    <Card className="border-amber-400/20 bg-amber-400/5">
      <CardContent className="flex gap-4 py-6">
        <DatabaseZap className="size-6 shrink-0 text-amber-300" />
        <div>
          <h2 className="font-bold text-amber-100">Chưa kết nối PostgreSQL</h2>
          <p className="mt-1 text-sm leading-6 text-amber-100/70">
            Tạo `.env.local` từ `.env.example`, thêm `DATABASE_URL`, rồi chạy
            `npm run db:migrate` và `npm run db:seed`.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
