"use client";

import { useState } from "react";
import { AccountsTable } from "@/components/dashboard/accounts-table";
import {
	FilterBar,
	ExtendedLocationFilterValues,
} from "@/components/dashboard/filter-bar";

export function AccountsPageClient() {
	const [filters, setFilters] = useState<ExtendedLocationFilterValues>({});

	const handleFilterChange = (newFilters: ExtendedLocationFilterValues) => {
		setFilters(newFilters);
	};

	return (
		<div className="flex flex-col gap-4">
			<FilterBar
				restrictToUserRegion={true}
				onFilterChange={handleFilterChange}
			/>
			<AccountsTable filters={filters} />
		</div>
	);
}
