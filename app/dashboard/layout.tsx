import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard - Barbearia BR99",
  description: "Sistema de gestão administrativo",
  icons: {
    icon: [
      { url: "/favicon-dashboard/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-dashboard/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-dashboard/favicon.ico" },
    ],
    apple: [
      { url: "/favicon-dashboard/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/favicon-dashboard/site.webmanifest",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
