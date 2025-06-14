import type { Metadata } from "next"
import { ContactsTable } from "@/components/dashboard/contacts-table"

export const metadata: Metadata = {
  title: "Client Disatisfaction",
  description: "Manage your client disatisfaction",
}

export default function ContactsPage() {
  return (
    <div className="flex flex-col gap-4">
      <ContactsTable />
    </div>
  )
}

