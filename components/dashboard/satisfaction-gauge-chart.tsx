"use client";

import React, { useMemo } from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DASHBOARD_ENDPOINTS } from "@/lib/api-config";
import { authFetcher } from "@/lib/api-utils";
import { LocationFilterValues } from "@/components/filters/location-filter";
import { ExtendedLocationFilterValues } from "@/components/dashboard/filter-bar";
import { Gauge } from "lucide-react";
import { useAuth } from "@/app/context/auth-context";

// Define the data structure expected from the API
interface SatisfactionData {
	satisfaction_percentage: number;
}

// Create a type for the props
interface Props {
	filters?: ExtendedLocationFilterValues;
}

export function SatisfactionGaugeChart({ filters }: Props) {
	// Get user from auth context
	const { user } = useAuth();

	// Build the endpoint URL with filters
	const endpoint = useMemo(() => {
		const baseUrl = DASHBOARD_ENDPOINTS.SATISFACTION_TREND;
		const params = new URLSearchParams();

		// If region filter is set, use that first
		if (filters?.region) {
			params.append("region", filters.region);
		}
		// Otherwise use user's region if available
		else if (user?.region) {
			params.append("region", user.region);
		}

		if (filters?.district) params.append("district", filters.district);
		if (filters?.facility) params.append("facility", filters.facility);

		// Set role parameter based on user's region
		if (user?.region) {
			params.append("role", "region");
		} else {
			params.append("role", "national");
		}

		// Add time period filters
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
			if (selectedYear) params.append("year", String(selectedYear));
		} else if (timePeriod === "by_month_year") {
			params.append("time_filter", "by_month_year");
			if (selectedYear) params.append("year", String(selectedYear));
			if (selectedMonth) params.append("month", selectedMonth);
		} else if (timePeriod === "by_quarter_year") {
			params.append("time_filter", "by_quarter_year");
			if (selectedYear) params.append("year", String(selectedYear));
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

		// Debug logging to verify filters are being applied
		console.log(
			"GaugeChart Endpoint:",
			fullEndpoint,
			"Filters:",
			filters
		);

		return fullEndpoint;
	}, [filters, user?.region]);

	// Fetch satisfaction trend data
	const { data, error, isLoading } = useSWR<SatisfactionData>(
		endpoint,
		authFetcher
	);

	// Extract the most recent satisfaction value
	const currentSatisfaction = useMemo(() => {
		if (!data || !data.satisfaction_percentage) return 0;
		return Math.round(data.satisfaction_percentage);
	}, [data]);

	// Get sentiment icon based on percentage
	const getSentimentIcon = (percentage: number) => {
		if (percentage >= 80) return "😊"; // Satisfied
		if (percentage >= 50) return "😐"; // Neutral
		return "😞"; // Dissatisfied
	};

	// Get satisfaction level text
	const getSatisfactionLevel = (percentage: number) => {
		if (percentage >= 80) return "Satisfied";
		if (percentage >= 50) return "Neutral";
		return "Dissatisfied";
	};

	// Calculate needle rotation based on percentage (0% = -90deg, 100% = 90deg)
	const getNeedleRotation = (percentage: number) => {
		// Map 0-100 to -90-90 degrees
		return (percentage / 100) * 180 - 90;
	};

	// Handle loading state
	if (isLoading) {
		return (
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">
						Overall Satisfaction
					</CardTitle>
					<Gauge className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent className="flex justify-center items-center h-[250px]">
					<div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
					<span className="ml-2">
						Loading satisfaction data...
					</span>
				</CardContent>
			</Card>
		);
	}

	// Handle error state
	if (error) {
		return (
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">
						Overall Satisfaction
					</CardTitle>
					<Gauge className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent className="flex justify-center items-center h-[250px] text-red-500">
					Error loading satisfaction data
				</CardContent>
			</Card>
		);
	}

	// Handle empty data
	if (!data) {
		return (
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">
						Overall Satisfaction
					</CardTitle>
					<Gauge className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent className="flex justify-center items-center h-[250px] text-gray-500">
					No satisfaction data available
				</CardContent>
			</Card>
		);
	}

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="text-sm font-medium">
					Overall Satisfaction
				</CardTitle>
				<Gauge className="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div className="flex flex-col items-center">
					{/* Improved SVG Gauge */}
					<div className="relative w-[300px] h-[200px]">
						<svg
							width="300"
							height="200"
							viewBox="0 0 300 200"
						>
							{/* Background track */}
							<path
								d="M 50,150 A 100,100 0 0,1 250,150"
								fill="none"
								stroke="#e5e7eb"
								strokeWidth="32"
								strokeLinecap="round"
							/>

							{/* Three distinct color arcs */}
							{/* Red arc: 0-50% */}
							<path
								d="M 50,150 A 100,100 0 0,1 150,50"
								fill="none"
								stroke="rgb(239, 68, 68)"
								strokeWidth="60"
								strokeLinecap="square"
							/>

							{/* Yellow arc: 50-100% (background for green) */}
							<path
								d="M 150,50 A 100,100 0 0,1 250,150"
								fill="none"
								stroke="rgb(253, 224, 71)"
								strokeWidth="60"
								strokeLinecap="square"
							/>

							{/* Green arc: 80-100% (overlay) */}
							<path
								d="M 208.78,69.10 A 100,100 0 0,1 250,150"
								fill="none"
								stroke="rgb(34, 197, 94)"
								strokeWidth="60"
								strokeLinecap="square"
							/>

							{/* Gauge labels with background circles */}
							{/* 0% label */}
							<text
								x="50"
								y="175"
								textAnchor="middle"
								fontSize="12"
								fill="currentColor"
							>
								0%
							</text>

							{/* 50% label - STRONGER YELLOW */}
							<text
								x="150"
								y="30"
								textAnchor="middle"
								fontSize="12"
								fill="currentColor"
							>
								50%
							</text>

							{/* 100% label */}
							<text
								x="250"
								y="175"
								textAnchor="middle"
								fontSize="12"
								fill="currentColor"
							>
								100%
							</text>

							{/* Needle */}
							<g
								transform={`rotate(${getNeedleRotation(
									currentSatisfaction
								)}, 150, 150)`}
							>
								<line
									x1="150"
									y1="150"
									x2="150"
									y2="70"
									stroke="black"
									strokeWidth="3"
								/>
								<circle
									cx="150"
									cy="150"
									r="10"
									fill="black"
									stroke="white"
									strokeWidth="2"
								/>
							</g>

							{/* Current value */}
							<text
								x="150"
								y="120"
								textAnchor="middle"
								fontSize="24"
								fontWeight="bold"
								fill="currentColor"
							>
								{currentSatisfaction}%
							</text>
						</svg>
					</div>

					<div className="text-center mb-2 mt-2">
						{/* Satisfaction rating and emoji */}
						<div className="text-xl font-medium">
							{getSatisfactionLevel(currentSatisfaction)}
						</div>
						{/* Emoji indicator */}
						<div className="text-5xl mb-2">
							{getSentimentIcon(currentSatisfaction)}
						</div>
					</div>

					{/* Satisfaction key */}
					<div className="mt-4 w-full pt-4 border-t">
						<div className="flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 text-sm">
							<span className="font-semibold">
								Satisfaction Key:
							</span>
							<div className="flex flex-wrap justify-center gap-4">
								<div className="flex items-center gap-1">
									<div className="w-4 h-4 rounded-full bg-green-500"></div>
									<span>Satisfied</span>
									<span className="text-xs text-gray-500">
										(80-100%)
									</span>
								</div>
								<div className="flex items-center gap-1">
									{/* STRONGER YELLOW */}
									<div className="w-4 h-4 rounded-full bg-yellow-200"></div>
									<span>Neutral</span>
									<span className="text-xs text-gray-500">
										(50-80%)
									</span>
								</div>
								<div className="flex items-center gap-1">
									<div className="w-4 h-4 rounded-full bg-red-500"></div>
									<span>Dissatisfied</span>
									<span className="text-xs text-gray-500">
										(0-50%)
									</span>
								</div>
							</div>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
