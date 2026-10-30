import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "YouTube Algorithm Analyzer",
  description: "Decode the Algorithm",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: '#0f0f0f', color: 'white', minHeight: '100vh' }}>
        {children}
      </body>
    </html>
  );
}