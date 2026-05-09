import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import Navbar from "@/components/shared/Navbar";
import CartSheet from "@/components/shared/CartSheet";
// 1. Import the Toaster

export const metadata: Metadata = {
  title: "BiteFlow | Order Delicious Food",
  description: "A modern food ordering platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-gray-50 text-gray-900 min-h-screen flex flex-col">
        <Navbar />
        <CartSheet />

        {/* 2. Add the Toaster component right here */}
        <Toaster position="bottom-right" reverseOrder={false} />

        <main className="flex-1">
          {children}
        </main>
      </body>
    </html>
  );
}