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

// Define the service point data type
interface ServicePointData {
	today: number;
	this_month: number;
	cumulative: number;
}

interface ServicePointResponse {
	status: string;
	data: Record<string, ServicePointData>;
}

interface ServicePointProgressProps {
	filters?: LocationFilterValues;
}

export function ServicePointProgress({ filters }: ServicePointProgressProps) {
	const [timeframe, setTimeframe] = useState<
		"today" | "this_month" | "cumulative"
	>("today");
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
		// Remove leading number and underscore
		const cleanName = name.replace(/^[0-9]+_/, "");
		// Replace underscores with spaces
		return cleanName.replace(/_/g, " ");
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
	const servicePointItems = Object.entries(data.data)
		.map(([name, values]) => ({
			name: formatServicePointName(name),
			originalName: name,
			value: values[timeframe],
			color: getProgressColor(values[timeframe]),
		}))
		.sort((a, b) => {
			// Sort by the original numeric prefix
			const numA = parseInt(a.originalName.split("_")[0]) || 0;
			const numB = parseInt(b.originalName.split("_")[0]) || 0;
			return numA - numB;
		});

	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="text-lg font-medium">
					Service Point Distribution
				</CardTitle>
				<Activity className="h-5 w-5 text-muted-foreground" />
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
					{servicePointItems.map((point) => (
						<div
							key={point.originalName}
							className="space-y-1"
						>
							<div className="flex justify-between text-sm">
								<span>{point.name}</span>
								<span className="font-medium">
									{point.value.toFixed(1)}%
								</span>
							</div>
							<div className="h-2 rounded-full bg-secondary overflow-hidden">
								<div
									className={`h-full rounded-full ${point.color}`}
									style={{
										width: `${point.value}%`,
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
