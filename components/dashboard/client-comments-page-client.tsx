"use client";

import { useState } from "react";
import { ClientCommentsTable } from "@/components/dashboard/client-comments-table";
import {
	FilterBar,
	ExtendedLocationFilterValues,
} from "@/components/dashboard/filter-bar";

export function ClientCommentsPageClient() {
	const [filters, setFilters] = useState<ExtendedLocationFilterValues>({});

	const handleFilterChange = (newFilters: ExtendedLocationFilterValues) => {
		setFilters(newFilters);
	};

	return (
		<div className="space-y-4">
			<h1 className="text-2xl font-bold">Client Comments</h1>
			<p className="text-muted-foreground">
				View and filter client feedback comments from various
				facilities.
			</p>

			<FilterBar
				restrictToUserRegion={true}
				onFilterChange={handleFilterChange}
			/>

			<ClientCommentsTable filters={filters} />
		</div>
	);
}
