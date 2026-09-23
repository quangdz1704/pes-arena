import Link from "next/link";
import { Goal } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center px-6 text-center">
      <div>
        <Goal className="mx-auto size-12 text-primary" />
        <p className="mt-5 text-sm font-bold uppercase tracking-[0.18em] text-primary">404</p>
        <h1 className="mt-2 text-3xl font-black">Sút ra ngoài rồi.</h1>
        <p className="mt-2 text-muted-foreground">Trang này không tồn tại trong PES Arena.</p>
        <Button asChild className="mt-6"><Link href="/">Về sân nhà</Link></Button>
      </div>
    </main>
  );
}
