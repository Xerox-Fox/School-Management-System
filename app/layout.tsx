import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LCCS School Management Portal",
  description: "Modern School Management System for Lideta Catholic Cathedral School",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
