"use client"
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { FormProvider } from "../contexts";
import { StateProviders } from "@/contexts/StateProvider";
import  { Toaster } from 'react-hot-toast';
import { SessionProvider } from "next-auth/react";
// const geistSans = Geist({
//   variable: "--font-geist-sans",
//   subsets: ["latin"],
// });

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

// export const metadata: Metadata = {
//   title: "FiSense",
//   description: "Find the credit card built for you.",
//   icons: {
//     icon: "/favicon.png",
//     shortcut: "/favicon.png",
//     apple: "/favicon.png",
//   },
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        // className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>
        <Toaster  position="top-right"/>
        <StateProviders>
        <FormProvider>
          {children}
        </FormProvider>
        </StateProviders>
        </SessionProvider>
      </body>
    </html>
  );
}
