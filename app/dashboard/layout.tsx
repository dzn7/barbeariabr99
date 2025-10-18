import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard - Barbearia BR99",
  description: "Sistema de gestão administrativo",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
