import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "DDE Parent Hub",
    short_name: "DDE Hub",
    description:
      "Understand your child's IEP, learn from DDE parent classes, and track progress at home.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#1f7977",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
