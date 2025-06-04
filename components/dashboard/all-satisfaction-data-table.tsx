"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import useSWR from "swr";
import { useAuth } from "@/app/context/auth-context";
import { Loader } from "@/components/ui/loader";
import { BASE_URL } from "@/lib/api-config";
import { authFetcher } from "@/lib/api-utils";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { LocationFilterValues } from "@/components/filters/location-filter";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import {
	Pagination,
	PaginationContent,
	PaginationItem,
	PaginationNext,
	PaginationPrevious,
	PaginationEllipsis,
	PaginationLink,
} from "@/components/ui/pagination";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface SatisfactionData {
	meta_instance_id: string;
	system_submission_date: string;
	region: string;
	district: string;
	facility: string;
	hlevel: string;
	ownership: string;
	reporting_period: string;
	demo_age: number;
	demo_gender: string;
	servicepoint: string;
	servicepoint_others: string | null;
	cleanliness: string;
	timeliness_of_services: string;
	privacy: string;
	respect: string;
	availability_of_medicines: string;
	availability_of_services: string;
	g_access_to_services: string;
	needed_time_given: string;
	cost_of_services: string;
	bribe: string;
	service_against_will: string;
	satifisaction: string;
	comments: string;
	system_submission_datession_date: string;
}

type TimeFilterType =
	| "today"
	| "this_month"
	| "last_month"
	| "current_quarter"
	| "previous_quarter"
	| "this_year"
	| "cumulative"
	| "by_date";

interface LocationFilterValuesWithDates extends LocationFilterValues {
	startDate: string | undefined;
	endDate: string | undefined;
	startYear: number | undefined;
	endYear: number | undefined;
	timeFilter: TimeFilterType;
}

interface ApiPagination {
	current_page: number;
	per_page: number;
	total_records: number;
	total_pages: number;
	has_next_page: boolean;
	has_previous_page: boolean;
}

interface ApiFiltersApplied {
	region: string | null;
	district: string | null;
	facility: string | null;
	date_from: string | null;
	date_to: string | null;
	time_filter: TimeFilterType;
	start_date: string | null;
	end_date: string | null;
	page: number;
	per_page: number;
}

interface ApiResponse {
	status: string;
	filters_applied: ApiFiltersApplied;
	data: {
		time_filter: TimeFilterType;
		pagination: ApiPagination;
		data: SatisfactionData[];
	};
}

const PAGE_SIZE = 20;

interface FilterBarProps {
	restrictToUserRegion?: boolean;
	onFilterChange: (filters: LocationFilterValuesWithDates) => void;
}

// Add months, quarters, and availableYears definitions
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

export function AllSatisfactionDataTable() {
	const { user } = useAuth();
	const [filters, setFilters] = useState<LocationFilterValuesWithDates>({
		region: "",
		district: "",
		facility: "",
		startDate: undefined,
		endDate: undefined,
		startYear: undefined,
		endYear: undefined,
		timeFilter: "this_year",
	});
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [allData, setAllData] = useState<SatisfactionData[]>([]);
	const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
	const [hasMore, setHasMore] = useState<boolean>(true);
	const [totalPages, setTotalPages] = useState<number>(1);
	const [activeTimeFilter, setActiveTimeFilter] =
		useState<TimeFilterType>("this_year");
	const loaderRef = useRef<HTMLDivElement>(null);
	const [selectedMonth, setSelectedMonth] = useState("");
	const [selectedQuarter, setSelectedQuarter] = useState("");
	const [selectedYear, setSelectedYear] = useState("");
	const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

	// Reset to page 1 and clear data when filters change
	useEffect(() => {
		setCurrentPage(1);
		setAllData([]);
		setHasMore(true);
		setTotalPages(1);
	}, [filters]);

	const handleFilterChange = useCallback(
		(newFilters: LocationFilterValuesWithDates) => {
			console.log("Filter changed in all data table:", newFilters);
			setFilters(newFilters);
		},
		[]
	);

	const handleTimeFilterClick = useCallback(
		(period: TimeFilterType) => {
			setActiveTimeFilter(period);
			handleFilterChange({ ...filters, timeFilter: period });
		},
		[filters, handleFilterChange]
	);

	const handleFilterBarChange = useCallback(
		(baseFilters: LocationFilterValues) => {
			const newFilters: LocationFilterValuesWithDates = {
				...baseFilters,
				startDate: filters.startDate,
				endDate: filters.endDate,
				startYear: filters.startYear,
				endYear: filters.endYear,
				timeFilter: filters.timeFilter,
			};
			handleFilterChange(newFilters);
		},
		[filters, handleFilterChange]
	);

	const buildEndpoint = useCallback(
		(page: number) => {
			const baseUrl = `${BASE_URL}/all_data`;
			const params = new URLSearchParams();

			// Add page parameter
			params.append("page", page.toString());

			// If region filter is set, use that first
			if (filters?.region) {
				params.append("region", filters.region);
			}
			// Otherwise use user's region if available
			else if (user?.region) {
				params.append("region", user.region);
			}

			// Add district filter if provided
			if (filters?.district) {
				params.append("district", filters.district);
			}

			// Add facility filter if provided
			if (filters?.facility) {
				params.append("facility", filters.facility);
			}

			// Add time filter
			if (filters?.timeFilter) {
				params.append("time_filter", filters.timeFilter);
			}

			// Add date range if provided
			if (filters?.startDate) {
				params.append("date_from", filters.startDate);
			}
			if (filters?.endDate) {
				params.append("date_to", filters.endDate);
			}

			const queryString = params.toString();
			const fullEndpoint = queryString
				? `${baseUrl}?${queryString}`
				: baseUrl;

			console.log("Built endpoint for page", page, ":", fullEndpoint);

			return fullEndpoint;
		},
		[filters, user?.region]
	);

	const { data, error, isLoading, mutate } = useSWR<ApiResponse>(
		buildEndpoint(currentPage),
		authFetcher,
		{
			dedupingInterval: 0,
			revalidateOnFocus: false,
			shouldRetryOnError: true,
			onSuccess: (data) => {
				if (data.data && data.data.pagination) {
					console.log(
						"Successfully fetched page",
						data.data.pagination.current_page,
						"with",
						data.data.data.length,
						"items. Total records:",
						data.data.pagination.total_records
					);
				} else {
					console.log("Fetched data, but pagination info is missing:", data);
				}
			},
			onError: (err) => {
				console.error("Error fetching data:", err);
			},
		}
	);

	// Update data processing to handle the new response format
	useEffect(() => {
		if (data?.data) {
			setAllData(data.data.data);
			if (data.data.pagination) {
				setHasMore(data.data.pagination.has_next_page);
				setTotalPages(data.data.pagination.total_pages);
				setCurrentPage(data.data.pagination.current_page);
			} else {
				setHasMore(false);
				setTotalPages(1);
				setCurrentPage(1);
			}
		}
	}, [data]);

	// Update pagination handling
	const handlePageChange = useCallback((newPage: number) => {
		setCurrentPage(newPage);
		// Scroll to top of the table
		window.scrollTo({ top: 0, behavior: "smooth" });
	}, []);

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString();
	};

	const formatServicePoint = (
		servicepoint: string,
		others: string | null
	) => {
		if (servicepoint === "9_Other" && others) {
			return others;
		}
		return servicepoint.replace(/_/g, " ").replace(/^\d+_/, "");
	};

	const getScoreColor = (score: string) => {
		const numScore = parseInt(score, 10);
		if (numScore === 3) return "bg-green-100 text-green-800";
		if (numScore === 2) return "bg-yellow-100 text-yellow-800";
		if (numScore === 1) return "bg-orange-100 text-orange-800";
		return "bg-red-100 text-red-800";
	};

	return (
		<div className="space-y-4">
			<FilterBar
				restrictToUserRegion={true}
				onFilterChange={handleFilterBarChange}
			/>

			{/* Time Filters UI */}
			<div className="flex flex-wrap gap-2 items-center mb-4">
				<Button
					variant={activeTimeFilter === "today" ? "default" : "outline"}
					onClick={() => {
						setActiveTimeFilter("today");
						setSelectedYear("");
						setSelectedMonth("");
						setSelectedQuarter("");
						setSelectedDate(undefined);
						handleTimeFilterClick("today");
					}}
					size="sm"
				>
					Today
				</Button>
				{/* Month Dropdown (enabled if year is selected) */}
				<Select value={selectedMonth} onValueChange={(value) => {
					setSelectedMonth(value);
					setActiveTimeFilter("this_month");
					setSelectedQuarter("");
					setSelectedDate(undefined);
					handleTimeFilterClick("this_month");
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
				{/* Quarter Dropdown (enabled if year is selected) */}
				<Select value={selectedQuarter} onValueChange={(value) => {
					setSelectedQuarter(value);
					setActiveTimeFilter("current_quarter");
					setSelectedMonth("");
					setSelectedDate(undefined);
					handleTimeFilterClick("current_quarter");
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
				{/* Year Dropdown */}
				<Select value={selectedYear} onValueChange={(value) => {
					setSelectedYear(value);
					setActiveTimeFilter("this_year");
					setSelectedMonth("");
					setSelectedQuarter("");
					setSelectedDate(undefined);
					handleTimeFilterClick("this_year");
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
					variant={activeTimeFilter === "cumulative" ? "default" : "outline"}
					onClick={() => {
						setActiveTimeFilter("cumulative");
						setSelectedYear("");
						setSelectedMonth("");
						setSelectedQuarter("");
						setSelectedDate(undefined);
						handleTimeFilterClick("cumulative" as TimeFilterType);
					}}
					size="sm"
				>
					Cumulative
				</Button>
				{/* Calendar for date selection as a popover */}
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
								setActiveTimeFilter("by_date");
								setSelectedYear("");
								setSelectedMonth("");
								setSelectedQuarter("");
								handleTimeFilterClick("by_date" as TimeFilterType);
							}}
							className="rounded-md border"
						/>
					</PopoverContent>
				</Popover>
			</div>

			{/* Display active filters */}
		
			<Card>
				<CardHeader>
					<CardTitle>Client Feedback Responses</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoading ? (
						<div className="h-96 flex items-center justify-center">
							<Loader
								size="lg"
								text="Loading satisfaction data..."
							/>
						</div>
					) : error ? (
						<div className="text-center text-red-500">
							Error loading data. Please try again.
						</div>
					) : !data?.data?.data ||
					  data.data.data.length === 0 ? (
						<div className="text-center text-muted-foreground">
							No data available for the selected time
							period
						</div>
					) : (
						<div className="space-y-4">
							<div className="text-sm text-muted-foreground">
								Showing {data.data.data.length} of{" "}
								{data.data.pagination.total_records}{" "}
								records
								{activeTimeFilter !== "this_year" &&
									` for ${activeTimeFilter.replace(
										/_/g,
										" "
									)}`}
							</div>

							<div className="rounded-md border">
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>
												Date
											</TableHead>
											<TableHead>
												Location
											</TableHead>
											<TableHead>
												Service Point
											</TableHead>
											<TableHead>
												Demographic
											</TableHead>
											<TableHead>
												Satisfaction
											</TableHead>
											<TableHead>
												Key Metrics
											</TableHead>
											<TableHead>
												Comments
											</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{data.data.data.map(
											(item) => (
												<TableRow
													key={
														item.meta_instance_id
													}
												>
													<TableCell className="whitespace-nowrap">
														{formatDate(
															item.system_submission_date
														)}
													</TableCell>
													<TableCell className="whitespace-nowrap">
														<div>
															{item.facility.replace(
																/_/g,
																" "
															)}
														</div>
														<div className="text-xs text-muted-foreground">
															{item.district.replace(
																/_/g,
																" "
															)}{" "}
															|{" "}
															{item.hlevel.replace(
																/_/g,
																" "
															)}
														</div>
													</TableCell>
													<TableCell className="whitespace-nowrap">
														{formatServicePoint(
															item.servicepoint,
															item.servicepoint_others
														)}
													</TableCell>
													<TableCell className="whitespace-nowrap">
														{
															item.demo_age
														}{" "}
														yrs |{" "}
														{
															item.demo_gender
														}
													</TableCell>
													<TableCell>
														<Badge
															variant={
																item.satifisaction ===
																"Yes"
																	? "default"
																	: "destructive"
															}
															className="rounded-sm"
														>
															{item.satifisaction ===
															"Yes"
																? "Satisfied"
																: "Not satisfied"}
														</Badge>
													</TableCell>
													<TableCell>
														<div className="flex gap-1 flex-wrap">
															<Badge
																className={`rounded-sm ${getScoreColor(
																	item.cleanliness
																)}`}
															>
																Cleanliness:{" "}
																{
																	item.cleanliness
																}
															</Badge>
															<Badge
																className={`rounded-sm ${getScoreColor(
																	item.privacy
																)}`}
															>
																Privacy:{" "}
																{
																	item.privacy
																}
															</Badge>
															<Badge
																className={`rounded-sm ${getScoreColor(
																	item.respect
																)}`}
															>
																Respect:{" "}
																{
																	item.respect
																}
															</Badge>
														</div>
													</TableCell>
													<TableCell className="max-w-[200px] truncate">
														{item.comments ||
															"No comments"}
													</TableCell>
												</TableRow>
											)
										)}
									</TableBody>
								</Table>
							</div>

							{data.data.pagination.total_pages > 1 && (
								<div className="flex justify-center mt-4">
									<Pagination>
										<PaginationContent>
											<PaginationItem>
												<Button
													variant="outline"
													size="sm"
													onClick={() =>
														handlePageChange(
															Math.max(
																1,
																currentPage -
																	1
															)
														)
													}
													disabled={
														currentPage ===
														1
													}
												>
													Previous
												</Button>
											</PaginationItem>

											{currentPage > 2 && (
												<>
													<PaginationItem>
														<PaginationLink
															onClick={() =>
																handlePageChange(
																	1
																)
															}
														>
															1
														</PaginationLink>
													</PaginationItem>
													{currentPage >
														3 && (
														<PaginationItem>
															<PaginationEllipsis />
														</PaginationItem>
													)}
												</>
											)}

											{currentPage > 1 && (
												<PaginationItem>
													<PaginationLink
														onClick={() =>
															handlePageChange(
																currentPage -
																	1
															)
														}
													>
														{currentPage -
															1}
													</PaginationLink>
												</PaginationItem>
											)}

											<PaginationItem>
												<PaginationLink
													isActive
												>
													{currentPage}
												</PaginationLink>
											</PaginationItem>

											{currentPage <
												data.data.pagination
													.total_pages && (
												<PaginationItem>
													<PaginationLink
														onClick={() =>
															handlePageChange(
																currentPage +
																	1
															)
														}
													>
														{currentPage +
															1}
													</PaginationLink>
												</PaginationItem>
											)}

											{currentPage <
												data.data.pagination
													.total_pages -
													1 && (
												<>
													{currentPage <
														data.data
															.pagination
															.total_pages -
															2 && (
														<PaginationItem>
															<PaginationEllipsis />
														</PaginationItem>
													)}
													<PaginationItem>
														<PaginationLink
															onClick={() =>
																handlePageChange(
																	data
																		.data
																		.pagination
																		.total_pages
																)
															}
														>
															{
																data
																	.data
																	.pagination
																	.total_pages
															}
														</PaginationLink>
													</PaginationItem>
												</>
											)}

											<PaginationItem>
												<Button
													variant="outline"
													size="sm"
													onClick={() =>
														handlePageChange(
															Math.min(
																data
																	.data
																	.pagination
																	.total_pages,
																currentPage +
																	1
															)
														)
													}
													disabled={
														currentPage ===
														data.data
															.pagination
															.total_pages
													}
												>
													Next
												</Button>
											</PaginationItem>
										</PaginationContent>
									</Pagination>
								</div>
							)}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
