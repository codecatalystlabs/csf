



import type { Metadata } from "next";
import { LeadsTable } from "@/components/dashboard/leads-table";

export const metadata: Metadata = {
	title: "Bribe",
	description: "Manage your bribe",
};

export default function OpportunitiesPage() {
	return (
		<div className="flex flex-col gap-4">
			<LeadsTable />
		</div>
	);
}

