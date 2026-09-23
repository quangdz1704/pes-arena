import { Gamepad2 } from "lucide-react";
import { ComingSoon } from "@/components/shared/coming-soon";

export default function NewMatchPage() {
  return <ComingSoon eyebrow="Thi đấu" title="Trận mới" description="Flow 1v1, 2v2, random người, ghép cặp và random đội." phase={2} icon={Gamepad2} />;
}
