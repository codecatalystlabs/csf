"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import useSWR from "swr";
import { Card, CardContent } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { authFetcher } from "@/lib/api-utils";
import { Loader2 } from "lucide-react";
import { BASE_URL, LOCATION_ENDPOINTS } from "@/lib/api-config";
import { useAuth } from "@/app/context/auth-context";

export interface LocationFilterValues {
	region?: string;
	district?: string;
	facility?: string;
}

export interface LocationFilterProps {
	onFilterChange: (values: LocationFilterValues) => void;
	showCard?: boolean;
	className?: string;
	apiBaseUrl?: string;
	// Set to true to restrict user to their assigned region
	restrictToUserRegion?: boolean;
}

export function LocationFilter({
	onFilterChange,
	showCard = true,
	className = "",
	apiBaseUrl = BASE_URL,
	restrictToUserRegion = true,
}: LocationFilterProps) {
	// Get user data from auth context
	const { user } = useAuth();

	// Check if user should have access to all regions (national role)
	const hasNationalAccess = user?.role === "national";

	// Initialize with user's region if available and restriction is enabled
	const [region, setRegion] = useState<string>("all_regions");
	const [district, setDistrict] = useState<string>("all_districts");
	const [facility, setFacility] = useState<string>("all_facilities");

	// Use refs to track previous values to prevent unnecessary updates
	const prevFiltersRef = useRef<LocationFilterValues>({});

	// Determine if the region dropdown should be disabled
	// Users with national role can access all regions
	const regionDisabled =
		restrictToUserRegion && Boolean(user?.region) && !hasNationalAccess;

	// Fetch regions
	const {
		data: regionsData,
		error: regionsError,
		isLoading: regionsLoading,
	} = useSWR(LOCATION_ENDPOINTS.REGIONS, authFetcher);

	// Ensure regions is an array or provide empty array fallback
	const allRegions =
		regionsData && regionsData.data && Array.isArray(regionsData.data)
			? regionsData.data.map((name: string) => ({ id: name, name }))
			: [];

	// Filter regions based on user's assigned region if restriction is enabled
	// National role users see all regions
	const regions =
		restrictToUserRegion && user?.region && !hasNationalAccess
			? allRegions.filter(
					(r: { id: string; name: string }) =>
						r.id === user.region
			  )
			: allRegions;

	// Fetch districts based on selected region using the endpoint builder
	const {
		data: districtsData,
		error: districtsError,
		isLoading: districtsLoading,
	} = useSWR(
		region && region !== "all_regions"
			? LOCATION_ENDPOINTS.getDistrictsForRegion(region)
			: null,
		authFetcher
	);

	// Ensure districts is an array or provide empty array fallback
	const districts =
		districtsData &&
		districtsData.data &&
		Array.isArray(districtsData.data)
			? districtsData.data.map((name: string) => ({ id: name, name }))
			: [];

	// Fetch facilities based on selected district using the endpoint builder
	const {
		data: facilitiesData,
		error: facilitiesError,
		isLoading: facilitiesLoading,
	} = useSWR(
		district && district !== "all_districts"
			? LOCATION_ENDPOINTS.getFacilitiesForDistrict(district)
			: null,
		authFetcher
	);

	// Ensure facilities is an array or provide empty array fallback
	const facilities =
		facilitiesData &&
		facilitiesData.data &&
		Array.isArray(facilitiesData.data)
			? facilitiesData.data.map((name: string) => ({ id: name, name }))
			: [];

	// Set user's region if available and restriction is enabled
	useEffect(() => {
		// Only auto-select region if user has a region assigned, restriction is enabled,
		// and they don't have national-level access
		if (
			restrictToUserRegion &&
			user?.region &&
			region === "all_regions" &&
			!hasNationalAccess
		) {
			setRegion(user.region);
		}
	}, [user, restrictToUserRegion, region, hasNationalAccess]);

	// Memoize the handleRegionChange function to prevent unnecessary re-renders
	const handleRegionChange = useCallback((value: string) => {
		setRegion(value);
		if (value === "all_regions") {
			setDistrict("all_districts");
		}
	}, []);

	// Memoize the handleDistrictChange function
	const handleDistrictChange = useCallback((value: string) => {
		setDistrict(value);
		if (value === "all_districts") {
			setFacility("all_facilities");
		}
	}, []);

	// Memoize the handleFacilityChange function
	const handleFacilityChange = useCallback((value: string) => {
		setFacility(value);
	}, []);

	// Apply filters when changed, with reference equality check
	useEffect(() => {
		const newFilters = {
			region: region !== "all_regions" ? region : undefined,
			district: district !== "all_districts" ? district : undefined,
			facility: facility !== "all_facilities" ? facility : undefined,
		};

		// Only update if filters have actually changed
		if (
			newFilters.region !== prevFiltersRef.current.region ||
			newFilters.district !== prevFiltersRef.current.district ||
			newFilters.facility !== prevFiltersRef.current.facility
		) {
			prevFiltersRef.current = newFilters;
			onFilterChange(newFilters);
		}
	}, [region, district, facility, onFilterChange]);

	// Memoize the clear filters handler
	const handleClearFilters = useCallback(() => {
		// If user has a restricted region and no national access, only clear district and facility
		if (restrictToUserRegion && user?.region && !hasNationalAccess) {
			setRegion(user.region);
			setDistrict("all_districts");
			setFacility("all_facilities");
		} else {
			setRegion("all_regions");
			setDistrict("all_districts");
			setFacility("all_facilities");
		}
	}, [restrictToUserRegion, user, hasNationalAccess]);

	const filtersContent = (
		<div className={`flex flex-wrap gap-4 items-center ${className}`}>
			<div className="flex-1 min-w-[200px]">
				<Select
					value={region}
					onValueChange={handleRegionChange}
					disabled={regionDisabled}
				>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="All Regions" />
					</SelectTrigger>
					<SelectContent>
						{(!restrictToUserRegion || hasNationalAccess) && (
							<SelectItem value="all_regions">
								All Regions
							</SelectItem>
						)}
						{regionsLoading ? (
							<div className="flex items-center justify-center py-2">
								<Loader2 className="h-4 w-4 animate-spin mr-2" />
								<span>Loading...</span>
							</div>
						) : regionsError ? (
							<div className="py-2 text-center text-red-500 text-sm">
								Error loading regions
							</div>
						) : regions && regions.length > 0 ? (
							regions.map(
								(r: { id: string; name: string }) => (
									<SelectItem
										key={r.id}
										value={r.id}
									>
										{r.name}
									</SelectItem>
								)
							)
						) : (
							<div className="py-2 text-center text-sm text-gray-500">
								No regions available
							</div>
						)}
					</SelectContent>
				</Select>
			</div>

			<div className="flex-1 min-w-[200px]">
				<Select
					value={district}
					onValueChange={handleDistrictChange}
					disabled={region === "all_regions"}
				>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="All Districts" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all_districts">
							All Districts
						</SelectItem>
						{districtsLoading ? (
							<div className="flex items-center justify-center py-2">
								<Loader2 className="h-4 w-4 animate-spin mr-2" />
								<span>Loading...</span>
							</div>
						) : districtsError ? (
							<div className="py-2 text-center text-red-500 text-sm">
								Error loading districts
							</div>
						) : districts && districts.length > 0 ? (
							districts.map(
								(d: { id: string; name: string }) => (
									<SelectItem
										key={d.id}
										value={d.id}
									>
										{d.name}
									</SelectItem>
								)
							)
						) : (
							<div className="py-2 text-center text-sm text-gray-500">
								No districts available
							</div>
						)}
					</SelectContent>
				</Select>
			</div>

			<div className="flex-1 min-w-[200px]">
				<Select
					value={facility}
					onValueChange={handleFacilityChange}
					disabled={district === "all_districts"}
				>
					<SelectTrigger className="w-full">
						<SelectValue placeholder="All Facilities" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="all_facilities">
							All Facilities
						</SelectItem>
						{facilitiesLoading ? (
							<div className="flex items-center justify-center py-2">
								<Loader2 className="h-4 w-4 animate-spin mr-2" />
								<span>Loading...</span>
							</div>
						) : facilitiesError ? (
							<div className="py-2 text-center text-red-500 text-sm">
								Error loading facilities
							</div>
						) : facilities && facilities.length > 0 ? (
							facilities.map(
								(f: { id: string; name: string }) => (
									<SelectItem
										key={f.id}
										value={f.id}
									>
										{f.name}
									</SelectItem>
								)
							)
						) : (
							<div className="py-2 text-center text-sm text-gray-500">
								No facilities available
							</div>
						)}
					</SelectContent>
				</Select>
			</div>

			<Button
				variant="outline"
				onClick={handleClearFilters}
				size="sm"
				className="whitespace-nowrap"
			>
				Clear Filters
			</Button>
		</div>
	);

	// Conditionally wrap in a Card component
	if (showCard) {
		return (
			<Card className="mb-4">
				<CardContent className="pt-4 pb-3">
					{filtersContent}
				</CardContent>
			</Card>
		);
	}

	return filtersContent;
}
