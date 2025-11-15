import type { Metadata } from "next";
import "./globals.css";
import Layout from "./components/layout/Layout";

export const metadata: Metadata = {
  title: "FlexTime - Time Tracking Analytics",
  description: "Time tracking analytics system for Flexscale agents",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <Layout>{children}</Layout>
      </body>
    </html>
  );
}

