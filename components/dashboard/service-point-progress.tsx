"use client";

import React, { useState, useMemo } from "react";
import useSWR from "swr";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader } from "@/components/ui/loader";
import { BASE_URL } from "@/lib/api-config";
import { Activity } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/app/context/auth-context";
import { LocationFilterValues } from "@/components/filters/location-filter";

// Updated types to match the actual API response
type TimeFrame =
	| "today"
	| "this_month"
	| "last_month"
	| "this_year"
	| "last_year"
	| "current_quarter"
	| "previous_quarter"
	| "cumulative";

// Define the service point data type for a specific time frame
interface ServicePointTimeFrameData {
	[key: string]: number;
}

interface ServicePointResponse {
	status: string;
	data: {
		[key in TimeFrame]: ServicePointTimeFrameData;
	};
}

interface ServicePointProgressProps {
	filters?: LocationFilterValues;
}

export function ServicePointProgress({ filters }: ServicePointProgressProps) {
	const [timeframe, setTimeframe] = useState<TimeFrame>("this_month");
	const { user } = useAuth();

	// Build the endpoint URL with role parameter
	const endpoint = useMemo(() => {
		const baseUrl = `${BASE_URL}/service_point_indicators`;
		const params = new URLSearchParams();

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
	}, [filters, user?.region]);

	// Fetcher function for the SWR hook
	const fetcher = (url: string) => fetch(url).then((res) => res.json());

	const { data, error, isLoading } = useSWR<ServicePointResponse>(
		endpoint,
		fetcher
	);

	// Function to determine color based on the value - using same colors as indicators
	const getProgressColor = (value: number): string => {
		if (value >= 80) return "bg-green-500";
		if (value > 50) return "bg-yellow-500";
		return "bg-red-500";
	};

	// Function to format service point name
	const formatServicePointName = (name: string): string => {
		// Replace underscores with spaces
		return name.replace(/_/g, " ");
	};

	if (isLoading)
		return (
			<div className="h-48 flex items-center justify-center">
				<Loader
					size="lg"
					text="Loading service point data..."
				/>
			</div>
		);
	if (error)
		return (
			<div className="text-red-500">
				Failed to load service point data
			</div>
		);
	if (!data) return null;

	// Get data for selected timeframe
	const servicePointItems =
		data?.data && data.data[timeframe]
			? Object.entries(data.data[timeframe])
					.map(([name, value]) => ({
						name: formatServicePointName(name),
						originalName: name,
						// Ensure value is a number and handle null/undefined
						value: typeof value === "number" ? value : 0,
						color: getProgressColor(
							typeof value === "number" ? value : 0
						),
					}))
					.sort((a, b) => b.value - a.value) // Sort by value descending
			: [];

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="text-lg font-medium">
					Satisfaction Rate By ServicePoint
				</CardTitle>
				<Activity className="h-5 w-5 text-muted-foreground" />
			</CardHeader>

			<CardContent className="space-y-4">
				<Tabs
					defaultValue="this_month"
					className="w-full"
					value={timeframe}
					onValueChange={(value) =>
						setTimeframe(value as TimeFrame)
					}
				>
					<TabsList className="grid w-full grid-cols-4">
						<TabsTrigger value="today">Today</TabsTrigger>
						<TabsTrigger value="this_month">
							This Month
						</TabsTrigger>
						<TabsTrigger value="last_month">
							Last Month
						</TabsTrigger>
						<TabsTrigger value="cumulative">
							Cumulative
						</TabsTrigger>
					</TabsList>
				</Tabs>

				<div className="space-y-4">
					{servicePointItems.map((point) => (
						<div
							key={point.originalName}
							className="space-y-1"
						>
							<div className="flex justify-between text-sm">
								<span>{point.name}</span>
								<span className="font-medium">
									{/* Add null check before using toFixed */}
									{point.value !== null &&
									point.value !== undefined
										? point.value.toFixed(1)
										: "0.0"}
									%
								</span>
							</div>
							<div className="h-2 rounded-full bg-secondary overflow-hidden">
								<div
									className={`h-full rounded-full ${point.color}`}
									style={{
										width: `${point.value || 0}%`,
									}}
								></div>
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	);
}
