"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { cn } from "@/lib/utils";

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
	const [selectedRegion, setSelectedRegion] = useState<string>("");
	const [selectedDistrict, setSelectedDistrict] = useState<string>("");
	const [selectedFacility, setSelectedFacility] = useState<string>("");

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
		selectedRegion && selectedRegion !== "all_regions"
			? LOCATION_ENDPOINTS.getDistrictsForRegion(selectedRegion)
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
		selectedDistrict && selectedDistrict !== "all_districts"
			? LOCATION_ENDPOINTS.getFacilitiesForDistrict(selectedDistrict)
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
			selectedRegion === "all_regions" &&
			!hasNationalAccess
		) {
			setSelectedRegion(user.region);
		}
	}, [user, restrictToUserRegion, selectedRegion, hasNationalAccess]);

	// Memoize the handleRegionChange function to prevent unnecessary re-renders
	const handleRegionChange = useCallback((value: string) => {
		setSelectedRegion(value);
		if (value === "all_regions") {
			setSelectedDistrict("all_districts");
		}
	}, []);

	// Memoize the handleDistrictChange function
	const handleDistrictChange = useCallback((value: string) => {
		setSelectedDistrict(value);
		if (value === "all_districts") {
			setSelectedFacility("all_facilities");
		}
	}, []);

	// Memoize the handleFacilityChange function
	const handleFacilityChange = useCallback((value: string) => {
		setSelectedFacility(value);
	}, []);

	// Apply filters when changed, with reference equality check
	useEffect(() => {
		const newFilters = {
			region:
				selectedRegion !== "all_regions"
					? selectedRegion
					: undefined,
			district:
				selectedDistrict !== "all_districts"
					? selectedDistrict
					: undefined,
			facility:
				selectedFacility !== "all_facilities"
					? selectedFacility
					: undefined,
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
	}, [selectedRegion, selectedDistrict, selectedFacility, onFilterChange]);

	// Memoize the clear filters handler
	const handleClearFilters = useCallback(() => {
		// If user has a restricted region and no national access, only clear district and facility
		if (restrictToUserRegion && user?.region && !hasNationalAccess) {
			setSelectedRegion(user.region);
			setSelectedDistrict("all_districts");
			setSelectedFacility("all_facilities");
		} else {
			setSelectedRegion("all_regions");
			setSelectedDistrict("all_districts");
			setSelectedFacility("all_facilities");
		}
	}, [restrictToUserRegion, user, hasNationalAccess]);

	const FilterContent = (
		<div className={cn("flex flex-wrap gap-3", className)}>
			<Select
				value={selectedRegion}
				onValueChange={(value) => {
					setSelectedRegion(value);
					setSelectedDistrict("all_districts");
					setSelectedFacility("all_facilities");
					onFilterChange({
						region:
							value === "all_regions" ? undefined : value,
					});
				}}
			>
				<SelectTrigger
					className={cn(
						"w-[180px] border-yellow-100 bg-white/50 hover:bg-yellow-50 transition-colors",
						selectedRegion &&
							selectedRegion !== "all_regions" &&
							"border-yellow-200 ring-1 ring-yellow-100"
					)}
				>
					<SelectValue placeholder="Select Region" />
				</SelectTrigger>
				<SelectContent className="max-h-[300px]">
					<SelectItem value="all_regions">
						All Regions
					</SelectItem>
					{regions.map((region) => (
						<SelectItem
							key={region.id}
							value={region.id}
							className="hover:bg-yellow-50 focus:bg-yellow-50 cursor-pointer"
						>
							{region.name.replace(/_/g, " ")}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<Select
				value={selectedDistrict}
				onValueChange={(value) => {
					setSelectedDistrict(value);
					setSelectedFacility("all_facilities");
					onFilterChange({
						region:
							selectedRegion === "all_regions"
								? undefined
								: selectedRegion,
						district:
							value === "all_districts"
								? undefined
								: value,
					});
				}}
				disabled={
					!selectedRegion || selectedRegion === "all_regions"
				}
			>
				<SelectTrigger
					className={cn(
						"w-[180px] border-yellow-100 bg-white/50 hover:bg-yellow-50 transition-colors",
						selectedDistrict &&
							selectedDistrict !== "all_districts" &&
							"border-yellow-200 ring-1 ring-yellow-100",
						(!selectedRegion ||
							selectedRegion === "all_regions") &&
							"opacity-50"
					)}
				>
					<SelectValue placeholder="Select District" />
				</SelectTrigger>
				<SelectContent className="max-h-[300px]">
					<SelectItem value="all_districts">
						All Districts
					</SelectItem>
					{districts.map((district) => (
						<SelectItem
							key={district.id}
							value={district.id}
							className="hover:bg-yellow-50 focus:bg-yellow-50 cursor-pointer"
						>
							{district.name.replace(/_/g, " ")}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<Select
				value={selectedFacility}
				onValueChange={(value) => {
					setSelectedFacility(value);
					onFilterChange({
						region:
							selectedRegion === "all_regions"
								? undefined
								: selectedRegion,
						district:
							selectedDistrict === "all_districts"
								? undefined
								: selectedDistrict,
						facility:
							value === "all_facilities"
								? undefined
								: value,
					});
				}}
				disabled={
					!selectedDistrict ||
					selectedDistrict === "all_districts"
				}
			>
				<SelectTrigger
					className={cn(
						"w-[180px] border-yellow-100 bg-white/50 hover:bg-yellow-50 transition-colors",
						selectedFacility &&
							selectedFacility !== "all_facilities" &&
							"border-yellow-200 ring-1 ring-yellow-100",
						(!selectedDistrict ||
							selectedDistrict === "all_districts") &&
							"opacity-50"
					)}
				>
					<SelectValue placeholder="Select Facility" />
				</SelectTrigger>
				<SelectContent className="max-h-[300px]">
					<SelectItem value="all_facilities">
						All Facilities
					</SelectItem>
					{facilities.map((facility) => (
						<SelectItem
							key={facility.id}
							value={facility.id}
							className="hover:bg-yellow-50 focus:bg-yellow-50 cursor-pointer"
						>
							{facility.name.replace(/_/g, " ")}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);

	if (showCard) {
		return (
			<Card className="border border-yellow-100/50 bg-gradient-to-r from-yellow-50/30 to-transparent">
				<CardHeader>
					<CardTitle className="text-lg font-medium text-yellow-800">
						Location Filter
					</CardTitle>
				</CardHeader>
				<CardContent>{FilterContent}</CardContent>
			</Card>
		);
	}

	return FilterContent;
}
