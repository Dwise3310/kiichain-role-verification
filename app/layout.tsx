import type { Metadata } from "next";
import "./globals.css";
import Providers from "@/components/Providers";
export const metadata: Metadata = { title: "KiiChain Community Verification", description: "x", metadataBase: new URL("http://localhost:3000") };
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en" className="dark"><body className="bg-noise min-h-screen antialiased"><Providers>{children}</Providers></body></html>);
}
