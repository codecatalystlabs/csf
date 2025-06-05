"use client";

import { useState } from "react";
import {
	BribeByRegionChart,
	DissatisfactionParetoChart,
} from "@/components/dashboard/contacts-table";
import {
	FilterBar,
	ExtendedLocationFilterValues,
} from "@/components/dashboard/filter-bar";

export function BribePageClient() {
	const [filters, setFilters] = useState<ExtendedLocationFilterValues>({});

	const handleFilterChange = (newFilters: ExtendedLocationFilterValues) => {
		setFilters(newFilters);
	};

	return (
		<div className="flex flex-col gap-4">
			<h1 className="text-2xl font-bold">Bribe Payment Analysis</h1>

			<FilterBar
				restrictToUserRegion={true}
				onFilterChange={handleFilterChange}
			/>

			<BribeByRegionChart filters={filters} />
			<DissatisfactionParetoChart filters={filters} />
		</div>
	);
}
