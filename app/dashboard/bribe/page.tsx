import type { Metadata } from "next";
import { BribeByRegionChartWithFilters } from "@/components/dashboard/contacts-table";

export const metadata: Metadata = {
	title: "Bribe Analysis",
	description: "Analyze bribe payments by region",
};

export default function BribePage() {
	return (
		<div className="flex flex-col gap-4">
			<h1 className="text-2xl font-bold">Bribe Payment Analysis</h1>
			<BribeByRegionChartWithFilters />
		</div>
	);
}
