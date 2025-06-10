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
import { ExtendedLocationFilterValues } from "@/components/dashboard/filter-bar";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { FilterBar } from "./filter-bar";

// Define the indicator data type
interface IndicatorData {
	today: number;
	this_month: number;
	cumulative: number;
	by_quarter_year: number;
	by_date: number;
	by_year: number;
	by_month: number;
	by_month_year: number;
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
	filters?: ExtendedLocationFilterValues;
}

// Add months, quarters, and availableYears definitions
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

export function IndicatorsProgress({ filters }: IndicatorsProgressProps) {
	// Get user from auth context
	const { user } = useAuth();

	// Build the endpoint URL with role parameter and time filters from global filters
	const endpoint = useMemo(() => {
		const baseUrl = `${BASE_URL}/indicators`;
		const params = new URLSearchParams();

		if (filters?.region) params.append("region", filters.region);
		if (filters?.district) params.append("district", filters.district);
		if (filters?.facility) params.append("facility", filters.facility);

		// Add time filter parameters from filters prop
		const timePeriod = filters?.timePeriod || "cumulative";
		const selectedYear = filters?.selectedYear;
		const selectedMonth = filters?.selectedMonth;
		const selectedQuarter = filters?.selectedQuarter;
		const selectedDate = filters?.selectedDate;

		if (timePeriod === "cumulative") {
			params.append("time_filter", "cumulative");
		} else if (timePeriod === "today") {
			params.append("time_filter", "today");
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
			params.append("time_filter", "cumulative");
		}

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
	if (!data || !data.data) return null;

	// Use the correct time filter key for indicator values
	const timePeriod = filters?.timePeriod || "cumulative";

	// Filter out excluded indicators and get data for selected time period
	const indicatorItems = Object.entries(data.data)
		.filter(([name]) => !EXCLUDED_INDICATORS.includes(name))
		.map(([name, values]) => {
			const v = typeof values === "number" ? values : (values as any)[timePeriod] ?? 0;
			return {
				name,
				value: v,
				color: getProgressColor(v),
			};
		})
		.sort((a, b) => b.value - a.value);

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
				>
					<TabsList className="grid w-full grid-cols-3">
						{/* <TabsTrigger value="today">Today</TabsTrigger>
						<TabsTrigger value="by_year">By year</TabsTrigger>
						<TabsTrigger value="cumulative">
							Cumulative
						</TabsTrigger> */}
						
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
