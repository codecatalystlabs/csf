"use client";

import React, { useMemo } from "react";
import useSWR from "swr";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
	PieChart,
	Pie,
	Cell,
	ResponsiveContainer,
	Legend,
	Tooltip,
} from "recharts";
import { Loader } from "@/components/ui/loader";
import { BASE_URL } from "@/lib/api-config";
import { PieChartIcon } from "lucide-react";
import { LocationFilterValues } from "@/components/filters/location-filter";
import { ExtendedLocationFilterValues } from "@/components/dashboard/filter-bar";
import { useAuth } from "@/app/context/auth-context";

interface SatisfactionData {
	labels: string[];
	datasets: {
		label: string;
		data: number[];
		backgroundColor: string[];
		borderColor: string[];
		borderWidth: number;
	}[];
}

interface Props {
	filters?: ExtendedLocationFilterValues;
}

// Fetcher function for the SWR hook
const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function SatisfactionPieChart({ filters }: Props) {
	// Get user from auth context
	const { user } = useAuth();

	// Build the endpoint URL with filters
	const endpoint = useMemo(() => {
		const baseUrl = `${BASE_URL}/overall_satisfaction`;
		const params = new URLSearchParams();

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
		console.log("PieChart Endpoint:", fullEndpoint, "Filters:", filters);

		return fullEndpoint;
	}, [filters, user?.region]);

	// Fetch satisfaction data
	const { data, error, isLoading } = useSWR<SatisfactionData>(
		endpoint,
		fetcher
	);

	// Format data for the recharts PieChart
	const formatDataForPieChart = (data: SatisfactionData) => {
		return data.labels.map((label, index) => ({
			name: label,
			value: data.datasets[0].data[index],
			color: data.datasets[0].backgroundColor[index],
			borderColor: data.datasets[0].borderColor[index],
		}));
	};

	// Calculate percentages for the pie chart
	const calculatePercentages = (data: SatisfactionData) => {
		const total = data.datasets[0].data.reduce(
			(sum, value) => sum + value,
			0
		);
		return data.datasets[0].data.map((value) =>
			((value / total) * 100).toFixed(1)
		);
	};

	// Custom tooltip for the pie chart
	const CustomTooltip = ({ active, payload }: any) => {
		if (active && payload && payload.length) {
			const data = payload[0].payload;
			const percentage = ((data.value / data.total) * 100).toFixed(1);
			return (
				<div className="custom-tooltip bg-white p-2 border rounded shadow">
					<p className="font-medium">{`${
						data.name
					}: ${data.value.toLocaleString()}`}</p>
					<p className="text-sm">{`${percentage}% of total`}</p>
				</div>
			);
		}
		return null;
	};

	// Handle loading state
	if (isLoading) {
		return (
			<Card className="h-full">
				<CardContent className="flex items-center justify-center pt-6 h-full">
					<Loader
						size="lg"
						text="Loading satisfaction data..."
					/>
				</CardContent>
			</Card>
		);
	}

	// Handle error state
	if (error || !data) {
		return (
			<Card className="h-full">
				<CardContent className="pt-6 text-red-500">
					Failed to load satisfaction data
				</CardContent>
			</Card>
		);
	}

	// Format data for the chart
	const chartData = formatDataForPieChart(data);
	const percentages = calculatePercentages(data);
	const total = data.datasets[0].data.reduce((sum, value) => sum + value, 0);

	// Add total to each item for tooltip calculation
	const dataWithTotal = chartData.map((item) => ({ ...item, total }));

	return (
		<Card className="h-full">
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="text-lg font-medium">
					Overall Client Satisfaction
				</CardTitle>
				<PieChartIcon className="h-5 w-5 text-muted-foreground" />
			</CardHeader>
			<CardContent className="pt-2">
				<div className="h-[250px] w-full">
					<ResponsiveContainer
						width="100%"
						height="100%"
					>
						<PieChart>
							<Pie
								data={dataWithTotal}
								cx="50%"
								cy="50%"
								labelLine={false}
								label={({ name, percent }) =>
									`${name}: ${(
										percent * 100
									).toFixed(1)}%`
								}
								outerRadius={80}
								fill="#8884d8"
								dataKey="value"
							>
								{dataWithTotal.map((entry, index) => (
									<Cell
										key={`cell-${index}`}
										fill={entry.color}
										stroke={entry.borderColor}
									/>
								))}
							</Pie>
							<Tooltip content={<CustomTooltip />} />
							<Legend />
						</PieChart>
					</ResponsiveContainer>
				</div>
				<div className="mt-4 text-center text-sm text-muted-foreground">
					Total Clients: {total.toLocaleString()}
				</div>
			</CardContent>
		</Card>
	);
}
