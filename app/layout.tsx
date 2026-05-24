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
      <body className="bg-gradient-to-br from-orange-50/50 via-white to-gray-50/70 text-gray-900 min-h-screen flex flex-col relative overflow-x-hidden antialiased">
        {/* Modern, high-end fixed ambient glows */}
        <div className="fixed top-[-10%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-orange-300/25 to-red-300/25 rounded-full blur-3xl pointer-events-none z-0" />
        <div className="fixed bottom-[-10%] left-[-10%] w-[700px] h-[700px] bg-gradient-to-tr from-amber-200/25 to-orange-200/25 rounded-full blur-3xl pointer-events-none z-0" />
        <div className="fixed top-[40%] left-[20%] w-[500px] h-[500px] bg-orange-200/15 rounded-full blur-3xl pointer-events-none z-0" />

        <div className="relative z-10 flex flex-col min-h-screen">
          <Navbar />
          <CartSheet />

          {/* 2. Add the Toaster component right here */}
          <Toaster position="bottom-right" reverseOrder={false} />

          <main className="flex-1">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}