import type { Metadata } from "next"
import { AccountsTable } from "@/components/dashboard/accounts-table"

export const metadata: Metadata = {
  title: "Regional Satisfaction Rate",
  description: "Regional Satisfaction Rate",
}

export default function AccountsPage() {
  return (
    <div className="flex flex-col gap-4">
      <AccountsTable />
    </div>
  )
}

