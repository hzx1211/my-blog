import type { Metadata } from "next";
import "./globals.css";
import "leaflet/dist/leaflet.css";
import PublicSiteWidgets from "@/components/blog/PublicSiteWidgets";

export const metadata: Metadata = {
  title: "黄志雄的博客",
  description: "记录技术、旅行、美食与生活，也分享一名计算机专业应届毕业生的成长与思考。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="font-sans antialiased bg-white">
        {children}
        <PublicSiteWidgets />
      </body>
    </html>
  );
}
