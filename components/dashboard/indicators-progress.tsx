"use client";

import React, { useState, useMemo } from "react";
import useSWR from "swr";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader } from "@/components/ui/loader";
import { BASE_URL } from "@/lib/api-config";
import { BarChart3 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/app/context/auth-context";
import { LocationFilterValues } from "@/components/filters/location-filter";

// Define the indicator data type
interface IndicatorData {
	today: number;
	this_month: number;
	cumulative: number;
}

interface IndicatorResponse {
	status: string;
	data: Record<string, IndicatorData>;
}

// List of indicators to exclude from display
const EXCLUDED_INDICATORS = [
	"Service Against Will",
	"Cost of Services",
	"Bribe",
];

interface IndicatorsProgressProps {
	filters?: LocationFilterValues;
}

export function IndicatorsProgress({ filters }: IndicatorsProgressProps) {
	const [timeframe, setTimeframe] = useState<
		"today" | "this_month" | "cumulative"
	>("today");

	// Get user from auth context
	const { user } = useAuth();

	// Build the endpoint URL with role parameter
	const endpoint = useMemo(() => {
		const baseUrl = `${BASE_URL}/indicators`;
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

	const { data, error, isLoading } = useSWR<IndicatorResponse>(
		endpoint,
		fetcher
	);

	// Function to determine color based on the value
	const getProgressColor = (value: number): string => {
		if (value >= 80) return "bg-green-500";
		if (value > 50) return "bg-yellow-500";
		return "bg-red-500";
	};

	if (isLoading)
		return (
			<div className="h-48 flex items-center justify-center">
				<Loader
					size="lg"
					text="Loading indicators data..."
				/>
			</div>
		);
	if (error)
		return (
			<div className="text-red-500">
				Failed to load indicators data
			</div>
		);
	if (!data) return null;

	// Filter out excluded indicators and get data for selected timeframe
	const indicatorItems = Object.entries(data.data)
		.filter(([name]) => !EXCLUDED_INDICATORS.includes(name)) // Filter out excluded indicators
		.map(([name, values]) => ({
			name,
			value: values[timeframe],
			color: getProgressColor(values[timeframe]),
		}))
		.sort((a, b) => b.value - a.value); // Sort by value descending

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="text-lg font-medium">
					Key Performance Indicators
				</CardTitle>
				<BarChart3 className="h-5 w-5 text-muted-foreground" />
			</CardHeader>

			<CardContent className="space-y-4">
				<Tabs
					defaultValue="today"
					className="w-full"
					onValueChange={(value) =>
						setTimeframe(
							value as
								| "today"
								| "this_month"
								| "cumulative"
						)
					}
				>
					<TabsList className="grid w-full grid-cols-3">
						<TabsTrigger value="today">Today</TabsTrigger>
						<TabsTrigger value="this_month">
							This Month
						</TabsTrigger>
						<TabsTrigger value="cumulative">
							Cumulative
						</TabsTrigger>
					</TabsList>
				</Tabs>

				<div className="space-y-4">
					{indicatorItems.map((indicator) => (
						<div
							key={indicator.name}
							className="space-y-1"
						>
							<div className="flex justify-between text-sm">
								<span>{indicator.name}</span>
								<span className="font-medium">
									{indicator.value}%
								</span>
							</div>
							<div className="h-2 rounded-full bg-secondary overflow-hidden">
								<div
									className={`h-full rounded-full ${indicator.color}`}
									style={{
										width: `${indicator.value}%`,
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
