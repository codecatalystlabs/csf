"use client";

import React, { useMemo } from "react";
import useSWR from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DASHBOARD_ENDPOINTS } from "@/lib/api-config";
import { authFetcher } from "@/lib/api-utils";
import { LocationFilterValues } from "@/components/filters/location-filter";
import { Gauge } from "lucide-react";
import { useAuth } from "@/app/context/auth-context";

// Define the data structure expected from the API
interface SatisfactionTrendData {
	labels: string[];
	datasets: {
		label: string;
		data: number[];
	}[];
}

interface Props {
	filters?: LocationFilterValues;
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
	const { data, error, isLoading } = useSWR<SatisfactionTrendData>(
		endpoint,
		authFetcher
	);

	// Extract the most recent satisfaction value
	const currentSatisfaction = useMemo(() => {
		if (!data || !data.datasets[0]?.data.length) return 0;
		// Get the most recent value from the dataset
		return Math.round(
			data.datasets[0].data[data.datasets[0].data.length - 1]
		);
	}, [data]);

	// Get sentiment icon based on percentage
	const getSentimentIcon = (percentage: number) => {
		if (percentage >= 80) return "😊"; // Satisfied
		if (percentage >= 50) return "😐"; // Neutral
		return "😞"; // Dissatisfied
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
					<div className="relative w-full max-w-[300px] mx-auto">
						{/* Gauge container */}
						<div className="relative h-[150px] overflow-hidden">
							{/* Semi-circle background */}
							<div className="absolute bottom-0 left-0 right-0 h-[150px] w-full rounded-t-full overflow-hidden">
								{/* Color zones - Red (0-50%) */}
								<div className="absolute bottom-0 left-0 h-full w-[33%] bg-red-500"></div>

								{/* Color zones - Yellow (50-80%) */}
								<div className="absolute bottom-0 left-[33%] h-full w-[27%] bg-yellow-300"></div>

								{/* Color zones - Green (80-100%) */}
								<div className="absolute bottom-0 right-0 h-full w-[40%] bg-green-500"></div>

								{/* Needle */}
								<div
									className="absolute bottom-0 left-1/2 transform -translate-x-[2px] origin-bottom"
									style={{
										rotate: `${getNeedleRotation(
											currentSatisfaction
										)}deg`,
										transition:
											"rotate 0.5s ease-out",
									}}
								>
									<div className="w-1 h-[140px] bg-blue-600"></div>
									<div className="w-4 h-4 rounded-full bg-blue-600 -mt-1 -ml-1.5"></div>
								</div>

								{/* Gauge ticks */}
								<div className="absolute bottom-0 w-full flex justify-between px-4 pb-4">
									<span className="text-xs font-bold text-white">
										0%
									</span>
									<span className="text-xs font-bold text-white">
										50%
									</span>
									<span className="text-xs font-bold text-white">
										100%
									</span>
								</div>
							</div>
						</div>

						<div className="text-center mb-2 mt-4">
							{/* Emoji indicator */}
							<div className="text-5xl mb-2">
								{getSentimentIcon(currentSatisfaction)}
							</div>

							{/* Percentage indicator */}
							<div className="text-2xl font-bold">
								[{currentSatisfaction}%]
							</div>
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
										({">"}80%)
									</span>
								</div>
								<div className="flex items-center gap-1">
									<div className="w-4 h-4 rounded-full bg-yellow-300"></div>
									<span>Neutral</span>
									<span className="text-xs text-gray-500">
										(50-80%)
									</span>
								</div>
								<div className="flex items-center gap-1">
									<div className="w-4 h-4 rounded-full bg-red-500"></div>
									<span>Dissatisfied</span>
									<span className="text-xs text-gray-500">
										({"<"}50%)
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
