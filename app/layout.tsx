import type { Metadata } from "next";
import { Toaster } from "react-hot-toast";
import "./globals.css";
import Navbar from "@/components/shared/Navbar";
import CartSheet from "@/components/shared/CartSheet";
import CustomizationModal from "@/components/shared/CustomizationModal";
import ThemeLanguageProvider from "@/components/shared/ThemeLanguageProvider";

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
      <body className="bg-gradient-to-br from-orange-50/50 via-white to-gray-50/70 text-gray-900 min-h-screen flex flex-col relative overflow-x-hidden antialiased transition-colors duration-300 dark:text-gray-100">
        <ThemeLanguageProvider>
          {/* Modern, high-end fixed ambient glows */}
          <div className="fixed top-[-10%] right-[-10%] w-[600px] h-[600px] bg-gradient-to-br from-orange-300/25 to-red-300/25 dark:from-orange-950/20 dark:to-red-950/20 rounded-full blur-3xl pointer-events-none z-0" />
          <div className="fixed bottom-[-10%] left-[-10%] w-[700px] h-[700px] bg-gradient-to-tr from-amber-200/25 to-orange-200/25 dark:from-amber-950/20 dark:to-orange-950/20 rounded-full blur-3xl pointer-events-none z-0" />
          <div className="fixed top-[40%] left-[20%] w-[500px] h-[500px] bg-orange-200/15 dark:bg-orange-950/10 rounded-full blur-3xl pointer-events-none z-0" />

          <div className="relative z-10 flex flex-col min-h-screen">
            <Navbar />
            <CartSheet />
            <CustomizationModal />

            {/* 2. Add the Toaster component right here */}
            <Toaster position="bottom-right" reverseOrder={false} />

            <main className="flex-1">
              {children}
            </main>
          </div>
        </ThemeLanguageProvider>
      </body>
    </html>
  );
}