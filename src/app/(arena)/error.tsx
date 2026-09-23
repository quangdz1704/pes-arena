"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function ArenaError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Card className="border-destructive/20 bg-destructive/5">
      <CardContent className="flex flex-col items-center py-16 text-center">
        <AlertTriangle className="size-10 text-destructive" />
        <h1 className="mt-4 text-xl font-black">VAR đang kiểm tra lỗi hệ thống.</h1>
        <p className="mt-2 text-sm text-muted-foreground">Không tải được dữ liệu. Hãy kiểm tra kết nối database rồi thử lại.</p>
        <Button onClick={reset} className="mt-6"><RotateCcw className="size-4" /> Thử lại</Button>
      </CardContent>
    </Card>
  );
}
