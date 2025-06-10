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
	overall_satisfaction: number;
}

// Create a type for the props
interface Props {
	filters?: ExtendedLocationFilterValues;
}

// Helper to get arc endpoint
function getArcEndpoint(cx: number, cy: number, r: number, angle: number) {
	const rad = (Math.PI / 180) * angle;
	return {
		x: cx + r * Math.cos(rad),
		y: cy + r * Math.sin(rad),
	};
}

export function SatisfactionGaugeChart({ filters }: Props) {
	// Get user from auth context
	const { user } = useAuth();

	// Build the endpoint URL with filters
	const endpoint = useMemo(() => {
		const baseUrl = DASHBOARD_ENDPOINTS.DASHBOARD_VISUALIZATION;
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
		if (!data || !data.overall_satisfaction) return 0;
		return Math.round(data.overall_satisfaction);
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

	// Define color thresholds for the gauge
	const getGaugeColor = (percentage: number) => {
		if (percentage < 50) return "#ef4444"; // Red
		if (percentage < 80) return "#f59e0b"; // Yellow
		return "#10b981"; // Green
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
				<CardTitle className="text-lg font-medium">
					Overall Client Satisfaction
				</CardTitle>
				<Gauge className="h-5 w-5 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div className="flex flex-col items-center justify-center" style={{ minHeight: 300 }}>
					{/* Gauge Chart */}
					<div className="w-full flex items-center justify-center" style={{ minHeight: 180 }}>
						<div className="relative w-[400px] h-[240px]">
							<svg viewBox="0 0 200 120" className="w-full h-full">
								{/* Red arc: 0-50% */}
								<path
									d="M 20,100 A 80,80 0 0,1 100,20"
									fill="none"
									stroke="#ef4444"
									strokeWidth="24"
									strokeLinecap="butt"
								/>
								{/* Yellow arc: 50-80% */}
								<path
									d="M 100,20 A 80,80 0 0,1 163.2,60.96"
									fill="none"
									stroke="#facc15"
									strokeWidth="24"
									strokeLinecap="butt"
								/>
								{/* Green arc: 80-100% */}
								<path
									d="M 163.2,60.96 A 80,80 0 0,1 180,100"
									fill="none"
									stroke="#22c55e"
									strokeWidth="24"
									strokeLinecap="butt"
								/>
								{/* Needle */}
								<line
									x1="100"
									y1="100"
									x2={100 + 70 * Math.cos(((getNeedleRotation(currentSatisfaction) - 90) * Math.PI) / 180)}
									y2={100 + 70 * Math.sin(((getNeedleRotation(currentSatisfaction) - 90) * Math.PI) / 180)}
									stroke="#222"
									strokeWidth="4"
								/>
								{/* Center circle */}
								<circle cx="100" cy="100" r="18" fill="#fff" stroke="#222" strokeWidth="3" />
								{/* Labels */}
								<text x="20" y="115" fontSize="16" fill="#222" textAnchor="middle">0%</text>
								<text x="100" y="28" fontSize="16" fill="#222" textAnchor="middle">50%</text>
								<text x="180" y="115" fontSize="16" fill="#222" textAnchor="middle">100%</text>
								{/* Emoji at the pivot */}
								<text x="100" y="108" fontSize="38" textAnchor="middle" dominantBaseline="middle">{getSentimentIcon(currentSatisfaction)}</text>
								{/* Percentage just above the emoji */}
								<text x="100" y="80" fontSize="32" fontWeight="bold" textAnchor="middle" fill="#222">{currentSatisfaction}%</text>
							</svg>
							<div className="flex flex-col items-center justify-center pointer-events-none">
								<p className="text-base text-muted-foreground mt-2">{getSatisfactionLevel(currentSatisfaction)}</p>
							</div>
						</div>
					</div>
					{/* Legend/Key below the chart */}
					<div className="flex justify-center gap-6 text-sm mt-8">
						<div className="flex items-center gap-2">
							<div className="w-4 h-4 bg-green-500 rounded"></div>
							<span>High (≥80%)</span>
						</div>
						<div className="flex items-center gap-2">
							<div className="w-4 h-4 bg-yellow-500 rounded"></div>
							<span>Medium (50-79%)</span>
						</div>
						<div className="flex items-center gap-2">
							<div className="w-4 h-4 bg-red-500 rounded"></div>
							<span>Low (&lt;50%)</span>
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
