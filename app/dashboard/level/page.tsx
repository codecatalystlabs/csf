



import type { Metadata } from "next";
import { LeadsTable } from "@/components/dashboard/leads-table";

export const metadata: Metadata = {
	title: "Level",
	description: "Level",
};

export default function OpportunitiesPage() {
	return (
		<div className="flex flex-col gap-4">
			<LeadsTable />
		</div>
	);
}

