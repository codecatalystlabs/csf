import type { Metadata } from "next"
import { ReportsDashboard } from "@/components/dashboard/reports-dashboard"

export const metadata: Metadata = {
  title: "Reports",
  description: "View your reports",
}

export default function ReportsPage() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Reports</h1>
      <ReportsDashboard />
    </div>
  )
}

