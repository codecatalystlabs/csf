"use client";

import { useState } from "react";
import { AllSatisfactionDataTable } from "@/components/dashboard/all-satisfaction-data-table";
import {
	FilterBar,
	ExtendedLocationFilterValues,
} from "@/components/dashboard/filter-bar";

export function AllDataPageClient() {
	const [filters, setFilters] = useState<ExtendedLocationFilterValues>({});

	const handleFilterChange = (newFilters: ExtendedLocationFilterValues) => {
		setFilters(newFilters);
	};

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

			<FilterBar
				restrictToUserRegion={true}
				onFilterChange={handleFilterChange}
			/>

			<AllSatisfactionDataTable filters={filters} />
		</div>
	);
}
