import type { Metadata } from "next";
import { Roboto } from "next/font/google";
import "./globals.css";
import { SocketProvider } from "@/SocketProvider";

const roboto = Roboto({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Google Maps Sync",
  description: "Explore Google Maps together in real-time.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${roboto.className}`}>
        <SocketProvider>{children}</SocketProvider>
      </body>
    </html>
  );
}
