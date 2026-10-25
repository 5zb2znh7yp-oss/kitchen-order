import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
return {
name: "店舗オーダーシステム",
short_name: "店舗システム",
description: "注文・キッチン・呼出・売上管理システム",
start_url: "/",
display: "standalone",
background_color: "#f1f5f9",
theme_color: "#0f172a",
orientation: "portrait",
icons: [
{
src: "/icon-192.png",
sizes: "192x192",
type: "image/png",
},
{
src: "/icon-512.png",
sizes: "512x512",
type: "image/png",
},
],
};
}
