"use client";

import React, { useMemo, useState, useEffect } from "react";
import useSWR from "swr";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader } from "@/components/ui/loader";
import { BASE_URL } from "@/lib/api-config";
import { Activity } from "lucide-react";
import { useAuth } from "@/app/context/auth-context";
import { LocationFilterValues } from "@/components/filters/location-filter";
import { ExtendedLocationFilterValues } from "@/components/dashboard/filter-bar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

// Define the service point data type
interface ServicePointData {
	[key: string]: number;
}

interface ServicePointResponse {
	status: string;
	data: ServicePointData;
}

interface ServicePointProgressProps {
	filters?: ExtendedLocationFilterValues;
}

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
	{ value: "1", label: "Q1 (Jan-Mar)" },
	{ value: "2", label: "Q2 (Apr-Jun)" },
	{ value: "3", label: "Q3 (Jul-Sep)" },
	{ value: "4", label: "Q4 (Oct-Dec)" },
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

export function ServicePointProgress({ filters }: ServicePointProgressProps) {
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

		// Add time period filters from filters prop
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
			if (selectedQuarter) params.append("quarter", String(selectedQuarter));
		} else if (timePeriod === "by_month") {
			params.append("time_filter", "by_month");
		} else if (timePeriod === "by_date") {
			params.append("time_filter", "by_date");
			if (selectedDate) {
				params.append("date_from", selectedDate.toISOString().split("T")[0]);
				params.append("date_to", selectedDate.toISOString().split("T")[0]);
			}
		} else {
			// Default to cumulative if no other time period is selected
			params.append("time_filter", "cumulative");
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
	const servicePointItems = data?.data
		? Object.entries(data.data)
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
