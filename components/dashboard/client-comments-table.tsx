"use client";

import React, { useState, useMemo } from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
	Pagination,
	PaginationContent,
	PaginationEllipsis,
	PaginationItem,
	PaginationLink,
	PaginationNext,
	PaginationPrevious,
} from "@/components/ui/pagination";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare } from "lucide-react";
import { Loader } from "@/components/ui/loader";
import { BASE_URL, DASHBOARD_ENDPOINTS } from "@/lib/api-config";
import { useAuth } from "@/app/context/auth-context";
import { LocationFilterValues } from "@/components/filters/location-filter";
import { authFetcher } from "@/lib/api-utils";

// Define the types for the API response
type TimeFrame =
	| "today"
	| "this_month"
	| "last_month"
	| "this_year"
	| "last_year"
	| "current_quarter"
	| "previous_quarter"
	| "cumulative";

interface Comment {
	facility: string;
	date: string;
	comment: string;
	servicepoint: string;
}

interface CommentsResponse {
	status: string;
	page: number;
	limit: number;
	filters: {
		[key in TimeFrame]: Comment[];
	};
	total: number;
}

interface ClientCommentsTableProps {
	filters?: LocationFilterValues;
}

export function ClientCommentsTable({ filters }: ClientCommentsTableProps) {
	const [timeframe, setTimeframe] = useState<TimeFrame>("this_month");
	const [page, setPage] = useState(1);
	const [limit] = useState(50);
	const { user } = useAuth();

	// Build the endpoint URL with filters
	const endpoint = useMemo(() => {
		const baseUrl = DASHBOARD_ENDPOINTS.CLIENT_COMMENTS;
		const params = new URLSearchParams();

		// Add pagination parameters
		params.append("page", page.toString());
		params.append("limit", limit.toString());

		// Add timeframe parameter
		params.append("timeframe", timeframe);

		// If region filter is set, use that first
		if (filters?.region) {
			params.append("region", filters.region);
		}
		// Otherwise use user's region if available
		else if (user?.region) {
			params.append("region", user.region);
		}

		// Add district and facility filters if provided
		if (filters?.district) {
			params.append("district", filters.district);
		}

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
		return queryString ? `${baseUrl}?${queryString}` : baseUrl;
	}, [filters, user?.region, page, limit, timeframe]);

	// Use the authFetcher to make authenticated API requests
	const { data, error, isLoading } = useSWR<CommentsResponse>(
		endpoint,
		authFetcher
	);

	// Format facility name by replacing underscores with spaces
	const formatFacilityName = (name: string): string => {
		return name.replace(/_/g, " ");
	};

	// Calculate pagination values
	const totalPages = useMemo(() => {
		if (!data) return 1;
		return Math.ceil(data.total / limit);
	}, [data, limit]);

	// Get comments for the selected timeframe
	const comments = useMemo(() => {
		if (!data || !data.filters[timeframe]) return [];
		return data.filters[timeframe];
	}, [data, timeframe]);

	// Handle page change
	const handlePageChange = (newPage: number) => {
		if (newPage > 0 && newPage <= totalPages) {
			setPage(newPage);
		}
	};

	// Generate pagination items
	const paginationItems = useMemo(() => {
		const items = [];
		const maxVisiblePages = 5;

		// Always show first page
		items.push(
			<PaginationItem key="first">
				<PaginationLink
					onClick={() => handlePageChange(1)}
					isActive={page === 1}
				>
					1
				</PaginationLink>
			</PaginationItem>
		);

		// Add ellipsis if needed
		if (page > 3) {
			items.push(
				<PaginationItem key="ellipsis-start">
					<PaginationEllipsis />
				</PaginationItem>
			);
		}

		// Add pages around current page
		const startPage = Math.max(2, page - 1);
		const endPage = Math.min(totalPages - 1, page + 1);

		for (let i = startPage; i <= endPage; i++) {
			if (i > 1 && i < totalPages) {
				items.push(
					<PaginationItem key={i}>
						<PaginationLink
							onClick={() => handlePageChange(i)}
							isActive={page === i}
						>
							{i}
						</PaginationLink>
					</PaginationItem>
				);
			}
		}

		// Add ellipsis if needed
		if (page < totalPages - 2) {
			items.push(
				<PaginationItem key="ellipsis-end">
					<PaginationEllipsis />
				</PaginationItem>
			);
		}

		// Always show last page if there's more than one page
		if (totalPages > 1) {
			items.push(
				<PaginationItem key="last">
					<PaginationLink
						onClick={() => handlePageChange(totalPages)}
						isActive={page === totalPages}
					>
						{totalPages}
					</PaginationLink>
				</PaginationItem>
			);
		}

		return items;
	}, [page, totalPages]);

	if (isLoading) {
		return (
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-lg font-medium">
						Client Comments
					</CardTitle>
					<MessageSquare className="h-5 w-5 text-muted-foreground" />
				</CardHeader>
				<CardContent className="h-[400px] flex items-center justify-center">
					<Loader
						size="lg"
						text="Loading comments..."
					/>
				</CardContent>
			</Card>
		);
	}

	if (error) {
		return (
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-lg font-medium">
						Client Comments
					</CardTitle>
					<MessageSquare className="h-5 w-5 text-muted-foreground" />
				</CardHeader>
				<CardContent className="h-[400px] flex items-center justify-center text-red-500">
					Error loading comments
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="text-lg font-medium">
					Client Comments
				</CardTitle>
				<MessageSquare className="h-5 w-5 text-muted-foreground" />
			</CardHeader>
			<CardContent className="space-y-4">
				<Tabs
					defaultValue="this_month"
					className="w-full"
					value={timeframe}
					onValueChange={(value) => {
						setTimeframe(value as TimeFrame);
						setPage(1); // Reset to first page when changing timeframe
					}}
				>
					<TabsList className="grid w-full grid-cols-4">
						<TabsTrigger value="today">Today</TabsTrigger>
						<TabsTrigger value="this_month">
							This Month
						</TabsTrigger>
						<TabsTrigger value="this_year">
							This Year
						</TabsTrigger>
						<TabsTrigger value="cumulative">
							All Time
						</TabsTrigger>
					</TabsList>
				</Tabs>

				{comments.length === 0 ? (
					<div className="h-[300px] flex items-center justify-center text-muted-foreground">
						No comments available for this time period
					</div>
				) : (
					<>
						<div className="rounded-md border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead className="w-[180px]">
											Facility
										</TableHead>
										<TableHead className="w-[150px]">
											Service Point
										</TableHead>
										<TableHead className="w-[120px]">
											Date
										</TableHead>
										<TableHead>Comment</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{comments.map((comment, index) => (
										<TableRow
											key={`${comment.facility}-${index}`}
										>
											<TableCell className="font-medium">
												{formatFacilityName(
													comment.facility
												)}
											</TableCell>
											<TableCell>
												{formatFacilityName(
													comment.servicepoint ||
														"N/A"
												)}
											</TableCell>
											<TableCell>
												{comment.date}
											</TableCell>
											<TableCell>
												{comment.comment}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>

						<Pagination>
							<PaginationContent>
								<PaginationItem>
									<PaginationPrevious
										onClick={() =>
											handlePageChange(
												page - 1
											)
										}
										className={
											page === 1
												? "pointer-events-none opacity-50"
												: ""
										}
									/>
								</PaginationItem>

								{paginationItems}

								<PaginationItem>
									<PaginationNext
										onClick={() =>
											handlePageChange(
												page + 1
											)
										}
										className={
											page === totalPages
												? "pointer-events-none opacity-50"
												: ""
										}
									/>
								</PaginationItem>
							</PaginationContent>
						</Pagination>
					</>
				)}
			</CardContent>
		</Card>
	);
}
