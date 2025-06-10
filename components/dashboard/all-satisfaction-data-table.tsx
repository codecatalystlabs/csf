"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import useSWR from "swr";
import { useAuth } from "@/app/context/auth-context";
import { Loader } from "@/components/ui/loader";
import { BASE_URL } from "@/lib/api-config";
import { authFetcher } from "@/lib/api-utils";
import { ExtendedLocationFilterValues } from "@/components/dashboard/filter-bar";
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
	page: number;
	per_page: number;
}

interface ApiResponse {
	status: string;
	filters_applied: ApiFiltersApplied;
	data: {
		pagination: ApiPagination;
		data: SatisfactionData[];
	};
}

const PAGE_SIZE = 50;

interface AllSatisfactionDataTableProps {
	filters?: ExtendedLocationFilterValues;
}

export function AllSatisfactionDataTable({
	filters,
}: AllSatisfactionDataTableProps) {
	const { user } = useAuth();
	const [currentPage, setCurrentPage] = useState<number>(1);
	const [allData, setAllData] = useState<SatisfactionData[]>([]);
	const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
	const [hasMore, setHasMore] = useState<boolean>(true);
	const [totalPages, setTotalPages] = useState<number>(1);
	const loaderRef = useRef<HTMLDivElement>(null);

	// Reset to page 1 and clear data when filters change
	useEffect(() => {
		setCurrentPage(1);
		setAllData([]);
		setHasMore(true);
		setTotalPages(1);
	}, [filters]);

	const buildEndpoint = useCallback(
		(page: number) => {
			const baseUrl = `/api/all_data`;
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

			// Add time period filters from ExtendedLocationFilterValues
			const timePeriod = filters?.timePeriod || "cumulative";
			const selectedYear = filters?.selectedYear;
			const selectedMonth = filters?.selectedMonth;
			const selectedQuarter = filters?.selectedQuarter;
			const selectedDate = filters?.selectedDate;

			if (timePeriod === "today") {
				params.append("time_filter", "today");
			} else if (timePeriod === "cumulative") {
				params.append("time_filter", "cumulative");
			} else if (timePeriod === "by_year") {
				params.append("time_filter", "by_year");
				if (selectedYear)
					params.append("year", String(selectedYear));
			} else if (timePeriod === "by_month_year") {
				params.append("time_filter", "by_month_year");
				if (selectedYear)
					params.append("year", String(selectedYear));
				if (selectedMonth) params.append("month", selectedMonth);
			} else if (timePeriod === "by_quarter_year") {
				params.append("time_filter", "by_quarter_year");
				if (selectedYear)
					params.append("year", String(selectedYear));
				if (selectedQuarter)
					params.append("quarter", String(selectedQuarter));
			} else if (timePeriod === "by_month") {
				params.append("time_filter", "by_month");
			} else if (timePeriod === "by_date") {
				params.append("time_filter", "by_date");
				if (selectedDate) {
					params.append(
						"date_from",
						selectedDate.toISOString().split("T")[0]
					);
					params.append(
						"date_to",
						selectedDate.toISOString().split("T")[0]
					);
				}
			} else {
				// Default to cumulative if no other time period is selected
				params.append("time_filter", "cumulative");
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
					console.log(
						"Fetched data, but pagination info is missing:",
						data
					);
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

	const tableData = Array.isArray(data?.data?.data)
		? data?.data?.data
		: Array.isArray(data?.data)
			? data?.data
			: [];

	// Determine pagination object safely
	const pagination = data?.data?.pagination || data?.pagination;
	const totalRecords = pagination?.total_records || 0;

	return (
		<div className="space-y-4">
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
					) : tableData.length === 0 ? (
						<div className="text-center text-muted-foreground">
							No data available for the selected time
							period
						</div>
					) : (
						<div className="space-y-4">
							<div className="text-sm text-muted-foreground">
								Showing {tableData.length} of{" "}
								{totalRecords} records
								{filters?.timePeriod !== "cumulative" &&
									` for ${filters?.timePeriod?.replace(
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
										{tableData.map(
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
															{item.facility?.replace(
																/_/g,
																" "
															)}
														</div>
														<div className="text-xs text-muted-foreground">
															{item.district?.replace(
																/_/g,
																" "
															)}{" "}
															|{" "}
															{item.hlevel?.replace(
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

							{pagination && pagination.total_pages > 1 && (
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
												pagination.total_pages && (
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
												pagination.total_pages -
													1 && (
												<>
													{currentPage <
														pagination.total_pages -
															2 && (
														<PaginationItem>
															<PaginationEllipsis />
														</PaginationItem>
													)}
													<PaginationItem>
														<PaginationLink
															onClick={() =>
																handlePageChange(
																	pagination.total_pages
																)
															}
														>
															{
																pagination.total_pages
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
																pagination.total_pages,
																currentPage +
																	1
															)
														)
													}
													disabled={
														currentPage ===
														pagination.total_pages
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
