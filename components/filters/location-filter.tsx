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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

export interface LocationFilterValues {
	region?: string;
	district?: string;
	facility?: string;
	time_filter?: string;
	year?: string;
	month?: string;
	quarter?: string;
	date?: string;
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
	const [selectedMonth, setSelectedMonth] = useState("");
	const [selectedQuarter, setSelectedQuarter] = useState("");
	const [selectedYear, setSelectedYear] = useState("");
	const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
	const [timeframe, setTimeframe] = useState<string>("cumulative");

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

	const months = [
		{ value: "01", label: "January" },
		{ value: "02", label: "February" },
		{ value: "03", label: "March" },
		{ value: "04", label: "April" },
		{ value: "05", label: "May" },
		{ value: "06", label: "June" },
		{ value: "07", label: "July" },
		{ value: "08", label: "August" },
		{ value: "09", label: "September" },
		{ value: "10", label: "October" },
		{ value: "11", label: "November" },
		{ value: "12", label: "December" },
	];

	const quarters = [
		{ value: "Q1", label: "Q1 (Jan-Mar)" },
		{ value: "Q2", label: "Q2 (Apr-Jun)" },
		{ value: "Q3", label: "Q3 (Jul-Sep)" },
		{ value: "Q4", label: "Q4 (Oct-Dec)" },
	];

	const generateYears = () => {
		const currentYear = new Date().getFullYear();
		const years = [];
		for (let year = 2020; year <= currentYear; year++) {
			years.push(year);
		}
		return years;
	};

	const availableYears = generateYears();

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
			time_filter: timeframe,
			year: selectedYear,
			month: selectedMonth,
			quarter: selectedQuarter,
			date: selectedDate?.toISOString().split("T")[0],
		};

		// Only update if filters have actually changed
		if (
			newFilters.region !== prevFiltersRef.current.region ||
			newFilters.district !== prevFiltersRef.current.district ||
			newFilters.facility !== prevFiltersRef.current.facility ||
			newFilters.time_filter !== prevFiltersRef.current.time_filter ||
			newFilters.year !== prevFiltersRef.current.year ||
			newFilters.month !== prevFiltersRef.current.month ||
			newFilters.quarter !== prevFiltersRef.current.quarter ||
			newFilters.date !== prevFiltersRef.current.date
		) {
			prevFiltersRef.current = newFilters;
			onFilterChange(newFilters);
		}
	}, [selectedRegion, selectedDistrict, selectedFacility, timeframe, selectedYear, selectedMonth, selectedQuarter, selectedDate, onFilterChange]);

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
				onValueChange={handleRegionChange}
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
					{regions.map((region: { id: string; name: string }) => (
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
				onValueChange={handleDistrictChange}
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
					{districts.map((district: { id: string; name: string }) => (
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
				onValueChange={handleFacilityChange}
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
					{facilities.map((facility: { id: string; name: string }) => (
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

			<div className="flex flex-wrap gap-2 items-center">
				<Button
					variant={timeframe === "today" ? "default" : "outline"}
					onClick={() => {
						setTimeframe("today");
						setSelectedYear("");
						setSelectedMonth("");
						setSelectedQuarter("");
						setSelectedDate(undefined);
					}}
					size="sm"
				>
					Today
				</Button>
				<Select value={selectedMonth} onValueChange={(value) => {
					setSelectedMonth(value);
					setTimeframe("by_month_year");
					setSelectedQuarter("");
					setSelectedDate(undefined);
				}} disabled={!selectedYear}>
					<SelectTrigger className="w-[120px]">
						<SelectValue placeholder="Month" />
					</SelectTrigger>
					<SelectContent>
						{months.map((month) => (
							<SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Select value={selectedQuarter} onValueChange={(value) => {
					setSelectedQuarter(value);
					setTimeframe("by_quarter_year");
					setSelectedMonth("");
					setSelectedDate(undefined);
				}} disabled={!selectedYear || !!selectedMonth}>
					<SelectTrigger className="w-[120px]">
						<SelectValue placeholder="Quarter" />
					</SelectTrigger>
					<SelectContent>
						{quarters.map((q) => (
							<SelectItem key={q.value} value={q.value}>{q.label}</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Select value={selectedYear} onValueChange={(value) => {
					setSelectedYear(value);
					setTimeframe("by_year");
					setSelectedMonth("");
					setSelectedQuarter("");
					setSelectedDate(undefined);
				}}>
					<SelectTrigger className="w-[120px]">
						<SelectValue placeholder="Year" />
					</SelectTrigger>
					<SelectContent>
						{availableYears.map((year) => (
							<SelectItem key={year} value={year.toString()}>{year}</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Button
					variant={timeframe === "cumulative" ? "default" : "outline"}
					onClick={() => {
						setTimeframe("cumulative");
						setSelectedYear("");
						setSelectedMonth("");
						setSelectedQuarter("");
						setSelectedDate(undefined);
					}}
					size="sm"
				>
					Cumulative
				</Button>
				<Popover>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							className={cn(
								"w-[220px] justify-start text-left font-normal",
								!selectedDate && "text-muted-foreground"
							)}
						>
							{selectedDate ? selectedDate.toLocaleDateString() : "Pick a date"}
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-auto p-0">
						<Calendar
							mode="single"
							selected={selectedDate}
							onSelect={(date) => {
								setSelectedDate(date);
								setTimeframe("by_date");
								setSelectedYear("");
								setSelectedMonth("");
								setSelectedQuarter("");
							}}
							className="rounded-md border"
						/>
					</PopoverContent>
				</Popover>
			</div>
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
