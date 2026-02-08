import type { Metadata } from "next";
import "./globals.css";
import { NewsletterProvider } from "@/context/NewsletterContext";

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
        <NewsletterProvider>
          {children}
        </NewsletterProvider>
      </body>
    </html>
  );
}
