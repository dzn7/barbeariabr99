import type { Metadata } from "next";
import { DashboardNotificationWrapper } from "@/components/DashboardNotificationWrapper";

export const metadata: Metadata = {
  title: "Dashboard - Barbearia BR99",
  description: "Sistema de gestão administrativo",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardNotificationWrapper>
      {children}
    </DashboardNotificationWrapper>
  );
}
