import type { Metadata } from "next";
import "./globals.css";
import { NewsletterProvider } from "@/context/NewsletterContext";
import ToolNav from "@/components/ToolNav";

export const metadata: Metadata = {
  title: "Planet Detroit Newsletter Builder",
  description: "Dashboard for building the weekly Planet Detroit newsletter",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased" suppressHydrationWarning>
        <ToolNav />
        <NewsletterProvider>
          {children}
        </NewsletterProvider>
      </body>
    </html>
  );
}
