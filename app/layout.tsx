import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "AI Text Formatter — Format AI Text & Export to DOCX / PDF",
  description: "Convert raw Markdown and LaTeX from AI tools like ChatGPT into perfectly formatted Word (.docx) documents and PDFs.",
  verification: {
    google: "google2d2d0b7de9a1ddde",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.variable}>
        {children}
      </body>
    </html>
  );
}
