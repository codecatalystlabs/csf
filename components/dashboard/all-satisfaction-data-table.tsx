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

interface ApiResponse {
	status: string;
	total: number;
	page: number;
	limit: number;
	total_pages: number;
	data: SatisfactionData[];
}

const PAGE_SIZE = 20;

export function AllSatisfactionDataTable() {
	const { user } = useAuth();
	const [filters, setFilters] = useState<LocationFilterValues>({});
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

	// Track page changes
	useEffect(() => {
		console.log("Current page changed to:", currentPage);
	}, [currentPage]);

	const handleFilterChange = useCallback(
		(newFilters: LocationFilterValues) => {
			console.log("Filter changed in all data table:", newFilters);
			setFilters(newFilters);
		},
		[]
	);

	// Build the endpoint URL with filters
	const buildEndpoint = useCallback(
		(page: number) => {
			const baseUrl = `${BASE_URL}/all_data`;
			const params = new URLSearchParams();

			// Add pagination parameters
			params.append("page", page.toString());
			params.append("limit", PAGE_SIZE.toString());

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

			// Set role parameter based on user's region
			if (user?.region) {
				params.append("role", "region");
			} else {
				params.append("role", "national");
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

	const endpoint = useMemo(
		() => buildEndpoint(currentPage),
		[buildEndpoint, currentPage]
	);

	const { data, error, isLoading } = useSWR<ApiResponse>(
		`${endpoint}_page${currentPage}`, // Add page to the key to ensure refetching
		() => authFetcher(endpoint),
		{
			dedupingInterval: 0, // Disable deduping to ensure we always fetch fresh data
			revalidateOnFocus: false, // Don't revalidate on focus
			shouldRetryOnError: true, // Retry on error
			onSuccess: (data) => {
				console.log(
					"Successfully fetched page",
					currentPage,
					"with",
					data.data?.length,
					"items"
				);
			},
			onError: (err) => {
				console.error(
					"Error fetching data for page",
					currentPage,
					err
				);
				setIsLoadingMore(false);
			},
		}
	);

	// Manual fetch function for the Load More button
	const fetchNextPage = useCallback(
		async (page: number) => {
			try {
				setIsLoadingMore(true);
				console.log("Manually fetching page", page);

				const endpoint = buildEndpoint(page);
				const response = await authFetcher(endpoint);

				console.log("Manual fetch response:", response);

				if (response && response.data) {
					setAllData((prev) => {
						const newData = [...prev, ...response.data];
						console.log(
							`Manually added ${response.data.length} items. Total now: ${newData.length}`
						);
						return newData;
					});

					setTotalPages(response.total_pages);
					setHasMore(page < response.total_pages);
				}
			} catch (err) {
				console.error("Error in manual fetch:", err);
			} finally {
				setIsLoadingMore(false);
			}
		},
		[buildEndpoint]
	);

	// Add debug logging for pagination data
	useEffect(() => {
		if (data) {
			console.log("Pagination data:", {
				page: data.page,
				total_pages: data.total_pages,
				total: data.total,
				limit: data.limit,
				currentDataLength: data.data?.length || 0,
				allDataLength: allData.length,
			});

			// Store total pages
			setTotalPages(data.total_pages);

			// Append new data to existing data
			if (data.data?.length) {
				setAllData((prev) => {
					// If we're on page 1, replace all data
					if (data.page === 1) {
						return [...data.data];
					}
					// Otherwise append new data
					const newData = [...prev, ...data.data];
					console.log(
						`Added ${data.data.length} items. Total now: ${newData.length}`
					);
					return newData;
				});
			}

			// Check if we've reached the end
			const reachedEnd = data.page >= data.total_pages;
			console.log(
				`Has more data: ${!reachedEnd} (page ${data.page} of ${
					data.total_pages
				})`
			);
			setHasMore(!reachedEnd);
			setIsLoadingMore(false);
		}
	}, [data]);

	// Function to load more data
	const loadMoreData = useCallback(() => {
		if (hasMore && !isLoadingMore && currentPage < totalPages) {
			console.log("Manually loading more data...");
			setIsLoadingMore(true);
			setCurrentPage((prev) => prev + 1);
		} else {
			console.log("Cannot load more:", {
				hasMore,
				isLoadingMore,
				currentPage,
				totalPages,
			});
		}
	}, [hasMore, isLoadingMore, currentPage, totalPages]);

	// Set up intersection observer for infinite scroll
	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				const target = entries[0];
				if (
					target.isIntersecting &&
					hasMore &&
					!isLoadingMore &&
					!isLoading &&
					currentPage < totalPages
				) {
					console.log("Loader is visible, loading more data...");
					loadMoreData();
				}
			},
			{
				root: null,
				rootMargin: "200px", // Load earlier, before the user reaches the very bottom
				threshold: 0.1,
			}
		);

		if (loaderRef.current) {
			observer.observe(loaderRef.current);
		}

		return () => {
			if (loaderRef.current) {
				observer.unobserve(loaderRef.current);
			}
		};
	}, [
		hasMore,
		isLoadingMore,
		isLoading,
		currentPage,
		totalPages,
		loadMoreData,
	]);

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

			<Card>
				<CardHeader>
					<CardTitle>Satisfaction Survey Responses</CardTitle>
				</CardHeader>
				<CardContent>
					{isLoading && currentPage === 1 ? (
						<div className="h-96 flex items-center justify-center">
							<Loader
								size="lg"
								text="Loading satisfaction data..."
							/>
						</div>
					) : error ? (
						<div className="text-red-500">
							Error loading data
						</div>
					) : !data || allData.length === 0 ? (
						<div>No data available</div>
					) : (
						<>
							<div className="text-sm text-muted-foreground mb-4">
								Showing {allData.length} of {data.total}{" "}
								total records
							</div>

							<div className="rounded-md border overflow-hidden mb-4">
								<div className="overflow-x-auto">
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
											{allData.length > 0 ? (
												allData.map(
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
																yrs
																|{" "}
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
												)
											) : (
												<TableRow>
													<TableCell
														colSpan={
															7
														}
														className="text-center py-4"
													>
														No data
														available
													</TableCell>
												</TableRow>
											)}
										</TableBody>
									</Table>
								</div>
							</div>

							{/* Infinite scroll loading indicator */}
							<div
								ref={loaderRef}
								className="flex flex-col items-center py-6 mt-4 border-t"
							>
								{isLoadingMore && (
									<div className="flex flex-col items-center">
										<Loader
											size="md"
											text="Loading more data..."
										/>
										<p className="text-sm text-muted-foreground mt-2">
											Loading page{" "}
											{currentPage} of{" "}
											{totalPages}
										</p>
									</div>
								)}

								{!isLoadingMore && (
									<div className="flex flex-col gap-2">
										<button
											className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
											onClick={() => {
												
												const nextPage =
													currentPage +
													1;
												
												fetchNextPage(
													nextPage
												);
											}}
										>
											Load More Data 
										</button>

										<button
											className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors text-sm"
											onClick={() => {
												
												// Force reset
												setCurrentPage(1);
												setAllData([]);
												setHasMore(true);
												console.log(
													"State reset to page 1"
												);
											}}
										>
											Reset
										</button>
									</div>
								)}

								{(!hasMore ||
									currentPage >= totalPages) &&
									allData.length > 0 && (
										<div className="text-sm text-muted-foreground mt-2">
											All data loaded (
											{allData.length} of{" "}
											{data.total} records)
										</div>
									)}
							</div>
						</>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
