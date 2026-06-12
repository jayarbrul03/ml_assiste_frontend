import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AV Label Platform",
  description: "Autonomous Vehicle Data Labeling Platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
