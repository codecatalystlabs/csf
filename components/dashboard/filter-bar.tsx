"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
	LocationFilter,
	LocationFilterValues,
} from "@/components/filters/location-filter";
import { BASE_URL } from "@/lib/api-config";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

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
		<Card className="border border-yellow-100/50 bg-gradient-to-r from-yellow-50/30 to-transparent backdrop-blur-sm">
			<CardContent className="p-4">
				<div className="flex flex-col gap-4 md:flex-row md:items-end">
					<div className="flex-1 space-y-1.5">
						<Label
							htmlFor="location-filter"
							className="text-sm font-medium text-yellow-800"
						>
							Location Filter
						</Label>
						<LocationFilter
							onFilterChange={handleFilterChange}
							showCard={false}
							restrictToUserRegion={restrictToUserRegion}
							className="w-full"
						/>
					</div>
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							className="border-yellow-200 hover:bg-yellow-50 hover:text-yellow-800 hover:border-yellow-300 transition-all duration-200"
							onClick={() => handleFilterChange({})}
						>
							Clear Filters
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
