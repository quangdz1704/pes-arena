"use client";

import { useEffect } from "react";
import { RefreshCw, WifiOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ArenaError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl py-16">
      <Card className="border-dashed bg-card/70">
        <CardContent className="flex flex-col items-center py-14 text-center">
          <WifiOff className="size-11 text-primary" />
          <h1 className="mt-5 text-xl font-black">Kết nối đang hơi lag</h1>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">Không tải được dữ liệu của PES Arena. Kiểm tra mạng rồi thử lại nhé.</p>
          <Button className="mt-6" onClick={reset}><RefreshCw className="size-4" /> Thử lại</Button>
        </CardContent>
      </Card>
    </div>
  );
}
