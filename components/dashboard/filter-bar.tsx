"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
	LocationFilter,
	LocationFilterValues,
} from "@/components/filters/location-filter";
import { BASE_URL } from "@/lib/api-config";

export interface FilterBarProps {
	restrictToUserRegion?: boolean;
	onFilterChange?: (filters: LocationFilterValues) => void;
}

export function FilterBar({
	restrictToUserRegion = true,
	onFilterChange,
}: FilterBarProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();

	// Initialize filter values from URL params
	const [filters, setFilters] = useState<LocationFilterValues>({
		region: searchParams.get("region") || undefined,
		district: searchParams.get("district") || undefined,
		facility: searchParams.get("facility") || undefined,
	});

	// Handle filter changes
	const handleFilterChange = useCallback(
		(newFilters: LocationFilterValues) => {
			setFilters(newFilters);
			// Notify parent component if callback is provided
			if (onFilterChange) {
				onFilterChange(newFilters);
			}
		},
		[onFilterChange]
	);

	// Update URL when filters change
	useEffect(() => {
		const params = new URLSearchParams(searchParams.toString());

		// Update region param
		if (filters.region) {
			params.set("region", filters.region);
		} else {
			params.delete("region");
		}

		// Update district param
		if (filters.district) {
			params.set("district", filters.district);
		} else {
			params.delete("district");
		}

		// Update facility param
		if (filters.facility) {
			params.set("facility", filters.facility);
		} else {
			params.delete("facility");
		}

		const newUrl = params.toString()
			? `${pathname}?${params.toString()}`
			: pathname;
		router.push(newUrl);
	}, [filters, pathname, router, searchParams]);

	return (
		<LocationFilter
			onFilterChange={handleFilterChange}
			apiBaseUrl={BASE_URL}
			restrictToUserRegion={restrictToUserRegion}
		/>
	);
}
