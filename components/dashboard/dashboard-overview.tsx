"use client";

import React, { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { LocationFilterValues } from "@/components/filters/location-filter";
import { useAuth } from "@/app/context/auth-context";
import { DashboardMetrics } from "./dashboard-metrics";
import { IndicatorsProgress } from "./indicators-progress";
import { ServicePointProgress } from "./service-point-progress";
import Image from "next/image";

export function DashboardOverview() {
	const { user } = useAuth();
	const [filters, setFilters] = useState<LocationFilterValues>({});

	const handleFilterChange = useCallback(
		(newFilters: LocationFilterValues) => {
			setFilters(newFilters);
		},
		[]
	);

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div className="flex items-center gap-2">
					<h1 className="text-2xl font-bold">Home</h1>
				</div>
				{user && (
					<div className="text-sm text-gray-600">
						Logged in as: {user.username}
						{user.role && ` (${user.role})`}
						{user.region && ` - ${user.region}`}
					</div>
				)}
			</div>

			<FilterBar
				restrictToUserRegion={true}
				onFilterChange={handleFilterChange}
			/>

			{/* Display active filters */}
			{(filters.region || filters.district || filters.facility) && (
				<div className="p-2 border rounded-md bg-blue-50 text-blue-700 text-sm mb-4">
					<strong>Filters applied:</strong>
					{filters.region &&
						` Region: ${filters.region.replace(/_/g, " ")}`}
					{filters.district &&
						` | District: ${filters.district.replace(
							/_/g,
							" "
						)}`}
					{filters.facility &&
						` | Facility: ${filters.facility.replace(
							/_/g,
							" "
						)}`}
				</div>
			)}

			{/* Dashboard metrics */}
			<DashboardMetrics filters={filters} />

			{/* Indicators and Service Point Progress side by side */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<IndicatorsProgress filters={filters} />
				<ServicePointProgress filters={filters} />
			</div>
		</div>
	);
}
