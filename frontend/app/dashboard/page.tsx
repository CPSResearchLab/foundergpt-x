import { DashboardAuthGate } from "@/components/auth/dashboard-auth-gate";
import { DashboardUI } from "@/components/shared/dashboard-ui";

export default function DashboardPage() {
  return <DashboardAuthGate><DashboardUI /></DashboardAuthGate>;
}
