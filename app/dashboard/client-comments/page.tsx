"use client";

import { useState } from "react";
import { ClientCommentsTable } from "@/components/dashboard/client-comments-table";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { LocationFilterValues } from "@/components/filters/location-filter";
import { YearRange } from "@/components/dashboard/filter-bar";

export default function ClientCommentsPage() {
	const [filters, setFilters] = useState<LocationFilterValues & YearRange>(
		{}
	);

	const handleFilterChange = (
		newFilters: LocationFilterValues & YearRange
	) => {
		setFilters(newFilters);
	};

	return (
		<div className="space-y-4">
			<h1 className="text-2xl font-bold">Client Comments</h1>
			<p className="text-muted-foreground">
				View and filter client feedback comments from various
				facilities.
			</p>

			<FilterBar onFilterChange={handleFilterChange} />

			<ClientCommentsTable filters={filters} />
		</div>
	);
}
