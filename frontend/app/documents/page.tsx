import { DashboardAuthGate } from "@/components/auth/dashboard-auth-gate";

export default function DocumentsPage() {
  return (
    <DashboardAuthGate>
      <main className="min-h-screen bg-[#050914] text-white p-10">
        <h1 className="text-4xl font-bold">Documents</h1>
      </main>
    </DashboardAuthGate>
  );
}
