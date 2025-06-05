"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { LocationFilterValues } from "@/components/filters/location-filter";
import { BASE_URL, LOCATION_ENDPOINTS } from "@/lib/api-config";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverTrigger,
	PopoverContent,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { FileText } from "lucide-react";
import { useAuth } from "@/app/context/auth-context";
import { authFetcher } from "@/lib/api-utils";
import useSWR from "swr";

// Extended interface to include time period filters
export interface ExtendedLocationFilterValues extends LocationFilterValues {
	timePeriod?: string;
	selectedYear?: string;
	selectedMonth?: string;
	selectedQuarter?: string;
	selectedDate?: Date;
}

export interface FilterBarProps {
	restrictToUserRegion?: boolean;
	onFilterChange?: (filters: ExtendedLocationFilterValues) => void;
	onRefresh?: () => void;
	onGenerateReport?: () => void;
	isGeneratingReport?: boolean;
	isLoading?: boolean;
}

// Function to generate a list of years (e.g., from 2020 to current year)
const generateYears = () => {
	const currentYear = new Date().getFullYear();
	const years = [];
	for (let year = 2020; year <= currentYear; year++) {
		years.push(year);
	}
	return years;
};

export function FilterBar({
	restrictToUserRegion = true,
	onFilterChange,
	onRefresh,
	onGenerateReport,
	isGeneratingReport = false,
	isLoading = false,
}: FilterBarProps) {
	const router = useRouter();
	const pathname = usePathname();
	const searchParams = useSearchParams();
	const { user } = useAuth();

	// Check if user should have access to all regions (national role)
	const hasNationalAccess = user?.role === "national";

	// Initialize location filter values from URL params
	const [selectedRegion, setSelectedRegion] = useState<string>(
		searchParams.get("region") || "all_regions"
	);
	const [selectedDistrict, setSelectedDistrict] = useState<string>(
		searchParams.get("district") || "all_districts"
	);
	const [selectedFacility, setSelectedFacility] = useState<string>(
		searchParams.get("facility") || "all_facilities"
	);

	// Time period states
	const [timePeriod, setTimePeriod] = useState<string>("cumulative");
	const [selectedYear, setSelectedYear] = useState<string>("");
	const [selectedMonth, setSelectedMonth] = useState<string>("");
	const [selectedQuarter, setSelectedQuarter] = useState<string>("");
	const [selectedDate, setSelectedDate] = useState<Date | undefined>(
		undefined
	);

	// Use refs to track previous values to prevent unnecessary updates
	const prevFiltersRef = useRef<ExtendedLocationFilterValues>({});

	const availableYears = generateYears();

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
	const regions =
		restrictToUserRegion && user?.region && !hasNationalAccess
			? allRegions.filter(
					(r: { id: string; name: string }) =>
						r.id === user.region
			  )
			: allRegions;

	// Fetch districts based on selected region
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

	// Fetch facilities based on selected district
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
		if (
			restrictToUserRegion &&
			user?.region &&
			selectedRegion === "all_regions" &&
			!hasNationalAccess
		) {
			setSelectedRegion(user.region);
		}
	}, [user, restrictToUserRegion, selectedRegion, hasNationalAccess]);

	// Handle region change
	const handleRegionChange = useCallback((value: string) => {
		setSelectedRegion(value);
		if (value === "all_regions") {
			setSelectedDistrict("all_districts");
			setSelectedFacility("all_facilities");
		}
	}, []);

	// Handle district change
	const handleDistrictChange = useCallback((value: string) => {
		setSelectedDistrict(value);
		if (value === "all_districts") {
			setSelectedFacility("all_facilities");
		}
	}, []);

	// Handle facility change
	const handleFacilityChange = useCallback((value: string) => {
		setSelectedFacility(value);
	}, []);

	// Notify parent component when any filter changes
	useEffect(() => {
		const combinedFilters: ExtendedLocationFilterValues = {
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
			timePeriod,
			selectedYear,
			selectedMonth,
			selectedQuarter,
			selectedDate,
		};

		// Only update if filters have actually changed
		if (
			combinedFilters.region !== prevFiltersRef.current.region ||
			combinedFilters.district !== prevFiltersRef.current.district ||
			combinedFilters.facility !== prevFiltersRef.current.facility ||
			combinedFilters.timePeriod !==
				prevFiltersRef.current.timePeriod ||
			combinedFilters.selectedYear !==
				prevFiltersRef.current.selectedYear ||
			combinedFilters.selectedMonth !==
				prevFiltersRef.current.selectedMonth ||
			combinedFilters.selectedQuarter !==
				prevFiltersRef.current.selectedQuarter ||
			combinedFilters.selectedDate !==
				prevFiltersRef.current.selectedDate
		) {
			prevFiltersRef.current = combinedFilters;
			if (onFilterChange) {
				onFilterChange(combinedFilters);
			}
		}
	}, [
		selectedRegion,
		selectedDistrict,
		selectedFacility,
		timePeriod,
		selectedYear,
		selectedMonth,
		selectedQuarter,
		selectedDate,
		onFilterChange,
	]);

	// Update URL when filters change
	useEffect(() => {
		const params = new URLSearchParams(searchParams.toString());

		// Update location params
		if (selectedRegion !== "all_regions") {
			params.set("region", selectedRegion);
		} else {
			params.delete("region");
		}

		if (selectedDistrict !== "all_districts") {
			params.set("district", selectedDistrict);
		} else {
			params.delete("district");
		}

		if (selectedFacility !== "all_facilities") {
			params.set("facility", selectedFacility);
		} else {
			params.delete("facility");
		}

		// Update time period params
		if (timePeriod !== "cumulative") {
			params.set("timePeriod", timePeriod);
		} else {
			params.delete("timePeriod");
		}

		if (selectedYear) {
			params.set("year", selectedYear);
		} else {
			params.delete("year");
		}

		if (selectedMonth) {
			params.set("month", selectedMonth);
		} else {
			params.delete("month");
		}

		if (selectedQuarter) {
			params.set("quarter", selectedQuarter);
		} else {
			params.delete("quarter");
		}

		if (selectedDate) {
			params.set("date", selectedDate.toISOString().split("T")[0]);
		} else {
			params.delete("date");
		}

		const newUrl = params.toString()
			? `${pathname}?${params.toString()}`
			: pathname;
		router.push(newUrl);
	}, [
		selectedRegion,
		selectedDistrict,
		selectedFacility,
		timePeriod,
		selectedYear,
		selectedMonth,
		selectedQuarter,
		selectedDate,
		pathname,
		router,
		searchParams,
	]);

	return (
		<Card className="border border-yellow-100/50 bg-gradient-to-r from-yellow-50/30 to-transparent backdrop-blur-sm">
			<CardContent className="p-4">
				<div className="flex flex-col gap-4">
					{/* Combined Location and Time Period Filters */}
					<div className="flex flex-col gap-4">
						<div className="space-y-1.5">
							<Label className="text-sm font-medium text-yellow-800">
								Filters
							</Label>
							{/* All Filters on Single Row */}
							<div className="flex flex-wrap gap-3 items-center">
								{/* Region Dropdown */}
								<Select
									value={selectedRegion}
									onValueChange={handleRegionChange}
								>
									<SelectTrigger
										className={cn(
											"w-[160px] border-yellow-100 bg-white/50 hover:bg-yellow-50 transition-colors",
											selectedRegion &&
												selectedRegion !==
													"all_regions" &&
												"border-yellow-200 ring-1 ring-yellow-100"
										)}
									>
										<SelectValue placeholder="Select Region" />
									</SelectTrigger>
									<SelectContent className="max-h-[300px]">
										<SelectItem value="all_regions">
											All Regions
										</SelectItem>
										{regions.map(
											(region: {
												id: string;
												name: string;
											}) => (
												<SelectItem
													key={region.id}
													value={
														region.id
													}
													className="hover:bg-yellow-50 focus:bg-yellow-50 cursor-pointer"
												>
													{region.name.replace(
														/_/g,
														" "
													)}
												</SelectItem>
											)
										)}
									</SelectContent>
								</Select>

								{/* District Dropdown */}
								<Select
									value={selectedDistrict}
									onValueChange={
										handleDistrictChange
									}
									disabled={
										!selectedRegion ||
										selectedRegion ===
											"all_regions"
									}
								>
									<SelectTrigger
										className={cn(
											"w-[160px] border-yellow-100 bg-white/50 hover:bg-yellow-50 transition-colors",
											selectedDistrict &&
												selectedDistrict !==
													"all_districts" &&
												"border-yellow-200 ring-1 ring-yellow-100",
											(!selectedRegion ||
												selectedRegion ===
													"all_regions") &&
												"opacity-50"
										)}
									>
										<SelectValue placeholder="Select District" />
									</SelectTrigger>
									<SelectContent className="max-h-[300px]">
										<SelectItem value="all_districts">
											All Districts
										</SelectItem>
										{districts.map(
											(district: {
												id: string;
												name: string;
											}) => (
												<SelectItem
													key={
														district.id
													}
													value={
														district.id
													}
													className="hover:bg-yellow-50 focus:bg-yellow-50 cursor-pointer"
												>
													{district.name.replace(
														/_/g,
														" "
													)}
												</SelectItem>
											)
										)}
									</SelectContent>
								</Select>

								{/* Facility Dropdown */}
								<Select
									value={selectedFacility}
									onValueChange={
										handleFacilityChange
									}
									disabled={
										!selectedDistrict ||
										selectedDistrict ===
											"all_districts"
									}
								>
									<SelectTrigger
										className={cn(
											"w-[160px] border-yellow-100 bg-white/50 hover:bg-yellow-50 transition-colors",
											selectedFacility &&
												selectedFacility !==
													"all_facilities" &&
												"border-yellow-200 ring-1 ring-yellow-100",
											(!selectedDistrict ||
												selectedDistrict ===
													"all_districts") &&
												"opacity-50"
										)}
									>
										<SelectValue placeholder="Select Facility" />
									</SelectTrigger>
									<SelectContent className="max-h-[300px]">
										<SelectItem value="all_facilities">
											All Facilities
										</SelectItem>
										{facilities.map(
											(facility: {
												id: string;
												name: string;
											}) => (
												<SelectItem
													key={
														facility.id
													}
													value={
														facility.id
													}
													className="hover:bg-yellow-50 focus:bg-yellow-50 cursor-pointer"
												>
													{facility.name.replace(
														/_/g,
														" "
													)}
												</SelectItem>
											)
										)}
									</SelectContent>
								</Select>

								{/* Separator */}
								<div className="hidden sm:block w-px h-8 bg-yellow-200 mx-1"></div>

								{/* Today Button */}
								<Button
									variant={
										timePeriod === "today"
											? "default"
											: "outline"
									}
									onClick={() => {
										setTimePeriod("today");
										setSelectedYear("");
										setSelectedMonth("");
										setSelectedQuarter("");
										setSelectedDate(undefined);
									}}
									size="sm"
									className="border-yellow-200 hover:bg-yellow-50 hover:text-yellow-800 hover:border-yellow-300"
								>
									Today
								</Button>

								{/* Year Dropdown */}
								<Select
									value={selectedYear}
									onValueChange={(value) => {
										setSelectedYear(value);
										setTimePeriod("by_year");
										setSelectedMonth("");
										setSelectedQuarter("");
										setSelectedDate(undefined);
									}}
								>
									<SelectTrigger className="w-[100px] border-yellow-100 bg-white/50 hover:bg-yellow-50">
										<SelectValue placeholder="Year" />
									</SelectTrigger>
									<SelectContent>
										{availableYears.map(
											(year) => (
												<SelectItem
													key={year}
													value={year.toString()}
													className="hover:bg-yellow-50 focus:bg-yellow-50"
												>
													{year}
												</SelectItem>
											)
										)}
									</SelectContent>
								</Select>

								{/* Month Dropdown (enabled if year is selected) */}
								<Select
									value={selectedMonth}
									onValueChange={(value) => {
										setSelectedMonth(value);
										setTimePeriod(
											"by_month_year"
										);
										setSelectedQuarter("");
										setSelectedDate(undefined);
									}}
									disabled={!selectedYear}
								>
									<SelectTrigger
										className={cn(
											"w-[110px] border-yellow-100 bg-white/50 hover:bg-yellow-50",
											!selectedYear &&
												"opacity-50"
										)}
									>
										<SelectValue placeholder="Month" />
									</SelectTrigger>
									<SelectContent>
										{months.map((month) => (
											<SelectItem
												key={month.value}
												value={month.value}
												className="hover:bg-yellow-50 focus:bg-yellow-50"
											>
												{month.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>

								{/* Quarter Dropdown (enabled if year is selected) */}
								<Select
									value={selectedQuarter}
									onValueChange={(value) => {
										setSelectedQuarter(value);
										setTimePeriod(
											"by_quarter_year"
										);
										setSelectedMonth("");
										setSelectedDate(undefined);
									}}
									disabled={
										!selectedYear ||
										!!selectedMonth
									}
								>
									<SelectTrigger
										className={cn(
											"w-[110px] border-yellow-100 bg-white/50 hover:bg-yellow-50",
											(!selectedYear ||
												!!selectedMonth) &&
												"opacity-50"
										)}
									>
										<SelectValue placeholder="Quarter" />
									</SelectTrigger>
									<SelectContent>
										{quarters.map((q) => (
											<SelectItem
												key={q.value}
												value={q.value}
												className="hover:bg-yellow-50 focus:bg-yellow-50"
											>
												{q.label}
											</SelectItem>
										))}
									</SelectContent>
								</Select>

								{/* Calendar for date selection as a popover */}
								<Popover>
									<PopoverTrigger asChild>
										<Button
											variant="outline"
											className={cn(
												"w-[180px] justify-start text-left font-normal border-yellow-100 bg-white/50 hover:bg-yellow-50",
												!selectedDate &&
													"text-muted-foreground"
											)}
										>
											{selectedDate
												? selectedDate.toLocaleDateString()
												: "Pick a date"}
										</Button>
									</PopoverTrigger>
									<PopoverContent className="w-auto p-0">
										<Calendar
											mode="single"
											selected={selectedDate}
											onSelect={(date) => {
												setSelectedDate(
													date
												);
												setTimePeriod(
													"by_date"
												);
												setSelectedYear("");
												setSelectedMonth(
													""
												);
												setSelectedQuarter(
													""
												);
											}}
											className="rounded-md border"
										/>
									</PopoverContent>
								</Popover>
								<Button
									variant="outline"
									size="sm"
									className="border-yellow-200 hover:bg-yellow-50 hover:text-yellow-800 hover:border-yellow-300 transition-all duration-200"
									onClick={() => {
										// Clear all filters
										if (
											restrictToUserRegion &&
											user?.region &&
											!hasNationalAccess
										) {
											setSelectedRegion(
												user.region
											);
										} else {
											setSelectedRegion(
												"all_regions"
											);
										}
										setSelectedDistrict(
											"all_districts"
										);
										setSelectedFacility(
											"all_facilities"
										);
										setTimePeriod("cumulative");
										setSelectedYear("");
										setSelectedMonth("");
										setSelectedQuarter("");
										setSelectedDate(undefined);
									}}
								>
									Clear Filters
								</Button>
							</div>
						</div>
					</div>

					{/* Action Buttons */}
					<div className="flex flex-wrap gap-2 items-end justify-end">
						<div className="flex gap-2">
							{onRefresh && (
								<Button
									variant="outline"
									size="sm"
									onClick={onRefresh}
									className="border-yellow-200 hover:bg-yellow-50 hover:text-yellow-800 hover:border-yellow-300"
								>
									Refresh
								</Button>
							)}
							{onGenerateReport && (
								<Button
									variant="default"
									size="sm"
									onClick={onGenerateReport}
									disabled={
										isGeneratingReport ||
										isLoading
									}
									className="gap-2 bg-yellow-600 hover:bg-yellow-700"
								>
									{isGeneratingReport ? (
										<>
											<div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-opacity-50 border-t-transparent"></div>
											Generating...
										</>
									) : (
										<>
											<FileText className="h-4 w-4" />
											Generate Report
										</>
									)}
								</Button>
							)}
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
