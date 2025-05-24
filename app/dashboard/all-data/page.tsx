import type { Metadata } from "next";
import { AllSatisfactionDataTable } from "@/components/dashboard/all-satisfaction-data-table";

export const metadata: Metadata = {
	title: "All Satisfaction Data",
	description: "View and filter all client satisfaction survey data",
};

export default function AllDataPage() {
	return (
		<div className="space-y-8 p-6">
			<div>
				<h2 className="text-3xl font-bold tracking-tight">
					All Satisfaction Data
				</h2>
				<p className="text-muted-foreground">
					Comprehensive view of all client Client Feedback
					Responses
				</p>
			</div>

			<AllSatisfactionDataTable />
		</div>
	);
}
