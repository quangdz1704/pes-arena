import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "PES Arena",
    short_name: "PES Arena",
    description: "Gaming hub riêng cho hội PES: random kèo, lưu kết quả và leo bảng xếp hạng.",
    start_url: "/",
    display: "standalone",
    background_color: "#0b0d10",
    theme_color: "#6aff94",
    lang: "vi",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
