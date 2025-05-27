"use client";

import React, { useState, useMemo, useCallback } from "react";
import { MoreHorizontal, ChevronDown, Search, ArrowUpDown } from "lucide-react";
import useSWR from "swr";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { BASE_URL } from "@/lib/api-config";
import { useAuth } from "@/app/context/auth-context";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { LocationFilterValues } from "@/components/filters/location-filter";
import { authFetcher } from "@/lib/api-utils";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	Cell,
	LabelList,
	LineChart,
	Line,
} from "recharts";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type TimePeriod =
	| "today"
	| "this_month"
	| "last_month"
	| "cumulative"
	| "last_year"
	| "this_year"
	| "current_quarter"
	| "previous_quarter"
	| "last_12_months";

interface SatisfactionComponentProps {
	filters?: LocationFilterValues;
	timeFilter?: TimePeriod;
}

interface TimeBasedSummary {
	total_clients: number;
	satisfied_clients: number;
	satisfaction_percentage: number;
}

interface MonthlyTrendData {
	labels: string[];
	percentages: number[];
}

interface ApiResponse {
	status: string;
	filters_applied: {
		region: string | null;
		district: string | null;
		facility: string | null;
	};
	summary: {
		[key in Exclude<TimePeriod, "last_12_months">]: TimeBasedSummary;
	} & {
		last_12_months: MonthlyTrendData;
	};
}

function SatisfactionSummaryTable({
	filters,
	timeFilter,
}: SatisfactionComponentProps) {
	const { user } = useAuth();

	// Build the endpoint URL with filters
	const endpoint = useMemo(() => {
		const baseUrl = `${BASE_URL}/trends_table`;
		const params = new URLSearchParams();

		// Add time filter parameter if specified
		if (timeFilter) {
			params.append("time_filter", timeFilter);
		}

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

		const queryString = params.toString();
		const fullEndpoint = queryString
			? `${baseUrl}?${queryString}`
			: baseUrl;

		// Debug logging to verify filters are being applied
		console.log(
			"Satisfaction Summary Endpoint:",
			fullEndpoint,
			"Filters:",
			filters,
			"TimeFilter:",
			timeFilter
		);

		return fullEndpoint;
	}, [filters, user?.region, timeFilter]);

	const { data, error, isLoading } = useSWR<ApiResponse>(
		endpoint,
		authFetcher
	);

	if (isLoading) return <div>Loading...</div>;
	if (error) return <div className="text-red-500">Failed to load data</div>;
	if (!data) return null;

	// Add data validation to prevent errors
	if (!data.summary) {
		return <div className="text-gray-500">No summary data available</div>;
	}

	// Color logic based on satisfaction percentage
	const getSatisfactionColor = (percentage: number) => {
		if (percentage >= 80) return "bg-green-100 text-green-800";
		if (percentage >= 50) return "bg-yellow-100 text-yellow-800";
		return "bg-red-100 text-red-800";
	};

	// Format time period labels
	const formatTimePeriod = (period: string) => {
		return period
			.replace(/_/g, " ")
			.replace(/\b\w/g, (l) => l.toUpperCase());
	};

	// Format month labels (e.g., "2024-05" to "May 2024")
	const formatMonthLabel = (monthStr: string) => {
		const [year, month] = monthStr.split("-");
		const monthNames = [
			"Jan",
			"Feb",
			"Mar",
			"Apr",
			"May",
			"Jun",
			"Jul",
			"Aug",
			"Sep",
			"Oct",
			"Nov",
			"Dec",
		];
		return `${monthNames[parseInt(month) - 1]} ${year}`;
	};

	// Handle last_12_months data differently
	if (timeFilter === "last_12_months") {
		const monthlyData = data.summary.last_12_months;
		if (!monthlyData.labels || !monthlyData.percentages) {
			return (
				<div className="text-gray-500">
					No monthly data available
				</div>
			);
		}

		return (
			<div className="space-y-4">
				{/* Current filter display */}
				{data.filters_applied && (
					<div className="p-3 border rounded-md bg-blue-50 text-blue-700 text-sm">
						<strong>Current Filters:</strong>
						{data.filters_applied.region &&
							` Region: ${data.filters_applied.region.replace(
								/_/g,
								" "
							)}`}
						{data.filters_applied.district &&
							` | District: ${data.filters_applied.district.replace(
								/_/g,
								" "
							)}`}
						{data.filters_applied.facility &&
							` | Facility: ${data.filters_applied.facility.replace(
								/_/g,
								" "
							)}`}
						{!data.filters_applied.region &&
							!data.filters_applied.district &&
							!data.filters_applied.facility &&
							" No location filters applied (showing national data)"}
					</div>
				)}

				{/* Monthly trends table */}
				<div className="overflow-x-auto">
					<table className="min-w-full border-collapse border border-gray-300">
						<thead>
							<tr>
								<th className="border border-gray-300 px-4 py-2 bg-gray-100 text-left text-sm font-medium">
									Month
								</th>
								<th className="border border-gray-300 px-4 py-2 bg-gray-100 text-center text-sm font-medium">
									Satisfaction Rate
								</th>
							</tr>
						</thead>
						<tbody>
							{monthlyData.labels.map((month, index) => (
								<tr
									key={month}
									className="hover:bg-gray-50"
								>
									<td className="border border-gray-300 px-4 py-2 font-medium">
										{formatMonthLabel(month)}
									</td>
									<td className="border border-gray-300 px-4 py-2 text-center">
										<span
											className={`px-2 py-1 rounded-full text-sm font-semibold ${getSatisfactionColor(
												monthlyData
													.percentages[
													index
												]
											)}`}
										>
											{monthlyData.percentages[
												index
											].toFixed(1)}
											%
										</span>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>

				{/* Legend */}
				<div className="flex flex-wrap gap-4 text-sm">
					<span className="font-semibold">
						Satisfaction Levels:
					</span>
					<div className="flex items-center gap-1">
						<div className="w-4 h-4 rounded bg-green-100"></div>
						<span>High (≥80%)</span>
					</div>
					<div className="flex items-center gap-1">
						<div className="w-4 h-4 rounded bg-yellow-100"></div>
						<span>Medium (50-79%)</span>
					</div>
					<div className="flex items-center gap-1">
						<div className="w-4 h-4 rounded bg-red-100"></div>
						<span>Low (&lt;50%)</span>
					</div>
				</div>
			</div>
		);
	}

	// Regular summary data for other time periods
	const summaryEntries = Object.entries(data.summary).filter(
		([key]) => key !== "last_12_months"
	) as [string, TimeBasedSummary][];

	return (
		<div className="space-y-4">
			{/* Current filter display */}
			{data.filters_applied && (
				<div className="p-3 border rounded-md bg-blue-50 text-blue-700 text-sm">
					<strong>Current Filters:</strong>
					{data.filters_applied.region &&
						` Region: ${data.filters_applied.region.replace(
							/_/g,
							" "
						)}`}
					{data.filters_applied.district &&
						` | District: ${data.filters_applied.district.replace(
							/_/g,
							" "
						)}`}
					{data.filters_applied.facility &&
						` | Facility: ${data.filters_applied.facility.replace(
							/_/g,
							" "
						)}`}
					{!data.filters_applied.region &&
						!data.filters_applied.district &&
						!data.filters_applied.facility &&
						" No location filters applied (showing national data)"}
				</div>
			)}

			{/* Summary table */}
			<div className="overflow-x-auto">
				<table className="min-w-full border-collapse border border-gray-300">
					<thead>
						<tr>
							<th className="border border-gray-300 px-4 py-2 bg-gray-100 text-left text-sm font-medium">
								Time Period
							</th>
							<th className="border border-gray-300 px-4 py-2 bg-gray-100 text-right text-sm font-medium">
								Total Clients
							</th>
							<th className="border border-gray-300 px-4 py-2 bg-gray-100 text-right text-sm font-medium">
								Satisfied Clients
							</th>
							<th className="border border-gray-300 px-4 py-2 bg-gray-100 text-center text-sm font-medium">
								Satisfaction Rate
							</th>
						</tr>
					</thead>
					<tbody>
						{summaryEntries.map(([period, summary]) => (
							<tr
								key={period}
								className="hover:bg-gray-50"
							>
								<td className="border border-gray-300 px-4 py-2 font-medium">
									{formatTimePeriod(period)}
								</td>
								<td className="border border-gray-300 px-4 py-2 text-right">
									{summary.total_clients.toLocaleString()}
								</td>
								<td className="border border-gray-300 px-4 py-2 text-right">
									{summary.satisfied_clients.toLocaleString()}
								</td>
								<td className="border border-gray-300 px-4 py-2 text-center">
									<span
										className={`px-2 py-1 rounded-full text-sm font-semibold ${getSatisfactionColor(
											summary.satisfaction_percentage
										)}`}
									>
										{summary.satisfaction_percentage.toFixed(
											1
										)}
										%
									</span>
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>

			{/* Legend */}
			<div className="flex flex-wrap gap-4 text-sm">
				<span className="font-semibold">Satisfaction Levels:</span>
				<div className="flex items-center gap-1">
					<div className="w-4 h-4 rounded bg-green-100"></div>
					<span>High (≥80%)</span>
				</div>
				<div className="flex items-center gap-1">
					<div className="w-4 h-4 rounded bg-yellow-100"></div>
					<span>Medium (50-79%)</span>
				</div>
				<div className="flex items-center gap-1">
					<div className="w-4 h-4 rounded bg-red-100"></div>
					<span>Low (&lt;50%)</span>
				</div>
			</div>
		</div>
	);
}

export function SatisfactionTrendsWithFilters() {
	const [filters, setFilters] = useState<LocationFilterValues>({});
	const [timePeriod, setTimePeriod] = useState<TimePeriod>("this_month");

	const handleFilterChange = useCallback(
		(newFilters: LocationFilterValues) => {
			console.log(
				"Filter changed in Satisfaction Trends:",
				newFilters
			);
			setFilters(newFilters);
		},
		[]
	);

	const handlePeriodChange = (period: TimePeriod) => {
		setTimePeriod(period);
	};

	return (
		<div className="flex flex-col gap-4">
			<FilterBar
				restrictToUserRegion={true}
				onFilterChange={handleFilterChange}
			/>

			{/* Time Filter Buttons */}
			<div className="flex flex-wrap gap-2 items-center">
				<Button
					variant={
						timePeriod === "today" ? "default" : "outline"
					}
					onClick={() => handlePeriodChange("today")}
					size="sm"
				>
					Today
				</Button>
				<Button
					variant={
						timePeriod === "this_month"
							? "default"
							: "outline"
					}
					onClick={() => handlePeriodChange("this_month")}
					size="sm"
				>
					This Month
				</Button>
				<Button
					variant={
						timePeriod === "current_quarter"
							? "default"
							: "outline"
					}
					onClick={() => handlePeriodChange("current_quarter")}
					size="sm"
				>
					Current Quarter
				</Button>
				<Button
					variant={
						timePeriod === "previous_quarter"
							? "default"
							: "outline"
					}
					onClick={() => handlePeriodChange("previous_quarter")}
					size="sm"
				>
					Previous Quarter
				</Button>
				<Button
					variant={
						timePeriod === "this_year" ? "default" : "outline"
					}
					onClick={() => handlePeriodChange("this_year")}
					size="sm"
				>
					This Year
				</Button>
				<Button
					variant={
						timePeriod === "last_month"
							? "default"
							: "outline"
					}
					onClick={() => handlePeriodChange("last_month")}
					size="sm"
				>
					Last Month
				</Button>
				<Button
					variant={
						timePeriod === "last_year" ? "default" : "outline"
					}
					onClick={() => handlePeriodChange("last_year")}
					size="sm"
				>
					Last Year
				</Button>
				<Button
					variant={
						timePeriod === "last_12_months"
							? "default"
							: "outline"
					}
					onClick={() => handlePeriodChange("last_12_months")}
					size="sm"
				>
					Last 12 Months
				</Button>
				<Button
					variant={
						timePeriod === "cumulative"
							? "default"
							: "outline"
					}
					onClick={() => handlePeriodChange("cumulative")}
					size="sm"
				>
					Cumulative
				</Button>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Satisfaction Rate Trends</CardTitle>
				</CardHeader>
				<CardContent>
					{/* Chart visualization */}
					<SatisfactionTrendsChart
						filters={filters}
						timeFilter={timePeriod}
					/>

					{/* Chart legend */}
					<div className="flex justify-center gap-6 text-sm mt-4 mb-6">
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
				</CardContent>
			</Card>

			{/* Commented out table for now */}
			{/* <Card>
				<CardHeader>
					<CardTitle>Detailed Satisfaction Summary</CardTitle>
				</CardHeader>
				<CardContent>
					<SatisfactionSummaryTable 
						filters={filters} 
						timeFilter={timePeriod}
					/>
				</CardContent>
			</Card> */}
		</div>
	);
}

export function AccountsTable() {
	const [filters, setFilters] = useState<LocationFilterValues>({});
	const [timePeriod, setTimePeriod] = useState<TimePeriod>("this_month");

	const handleFilterChange = useCallback(
		(newFilters: LocationFilterValues) => {
			setFilters(newFilters);
		},
		[]
	);

	const handlePeriodChange = (period: TimePeriod) => {
		setTimePeriod(period);
	};

	return (
		<div className="flex flex-col gap-4">
			<FilterBar
				restrictToUserRegion={true}
				onFilterChange={handleFilterChange}
			/>

			{/* Time Filter Buttons */}
			<div className="flex flex-wrap gap-2 items-center">
				<Button
					variant={
						timePeriod === "today" ? "default" : "outline"
					}
					onClick={() => handlePeriodChange("today")}
					size="sm"
				>
					Today
				</Button>
				<Button
					variant={
						timePeriod === "this_month"
							? "default"
							: "outline"
					}
					onClick={() => handlePeriodChange("this_month")}
					size="sm"
				>
					This Month
				</Button>
				<Button
					variant={
						timePeriod === "current_quarter"
							? "default"
							: "outline"
					}
					onClick={() => handlePeriodChange("current_quarter")}
					size="sm"
				>
					Current Quarter
				</Button>
				<Button
					variant={
						timePeriod === "previous_quarter"
							? "default"
							: "outline"
					}
					onClick={() => handlePeriodChange("previous_quarter")}
					size="sm"
				>
					Previous Quarter
				</Button>
				<Button
					variant={
						timePeriod === "this_year" ? "default" : "outline"
					}
					onClick={() => handlePeriodChange("this_year")}
					size="sm"
				>
					This Year
				</Button>
				<Button
					variant={
						timePeriod === "last_month"
							? "default"
							: "outline"
					}
					onClick={() => handlePeriodChange("last_month")}
					size="sm"
				>
					Last Month
				</Button>
				<Button
					variant={
						timePeriod === "last_year" ? "default" : "outline"
					}
					onClick={() => handlePeriodChange("last_year")}
					size="sm"
				>
					Last Year
				</Button>
				<Button
					variant={
						timePeriod === "last_12_months"
							? "default"
							: "outline"
					}
					onClick={() => handlePeriodChange("last_12_months")}
					size="sm"
				>
					Last 12 Months
				</Button>
				<Button
					variant={
						timePeriod === "cumulative"
							? "default"
							: "outline"
					}
					onClick={() => handlePeriodChange("cumulative")}
					size="sm"
				>
					Cumulative
				</Button>
			</div>

			{/* Display active filters */}
			{(filters.region || filters.district || filters.facility) && (
				<div className="p-2 border rounded-md bg-blue-50 text-blue-700 text-sm mb-4">
					<strong>Filters applied:</strong>
					{filters.region &&
						` Region: ${filters.region.replace(/_/g, " ")}`}
					{filters.district &&
						` | District: ${filters.district.replace(
							/_/g,
							" "
						)}`}
					{filters.facility &&
						` | Facility: ${filters.facility.replace(
							/_/g,
							" "
						)}`}
				</div>
			)}

			<Card>
				<CardHeader>
					<CardTitle>Satisfaction Rate Trends</CardTitle>
				</CardHeader>
				<CardContent>
					{/* Chart visualization */}
					<SatisfactionTrendsChart
						filters={filters}
						timeFilter={timePeriod}
					/>

					{/* Chart legend */}
					<div className="flex justify-center gap-6 text-sm mt-4 mb-6">
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
				</CardContent>
			</Card>

			{/* Commented out table for now */}
			{/* <Card>
				<CardHeader>
					<CardTitle>Detailed Satisfaction Summary</CardTitle>
				</CardHeader>
				<CardContent>
					<SatisfactionSummaryTable 
						filters={filters} 
						timeFilter={timePeriod}
					/>
				</CardContent>
			</Card> */}
		</div>
	);
}

function SatisfactionTrendsChart({
	filters,
	timeFilter,
}: SatisfactionComponentProps) {
	const { user } = useAuth();

	// Build the endpoint URL with filters
	const endpoint = useMemo(() => {
		const baseUrl = `${BASE_URL}/trends_table`;
		const params = new URLSearchParams();

		// Add time filter parameter if specified
		if (timeFilter) {
			params.append("time_filter", timeFilter);
		}

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

		const queryString = params.toString();
		const fullEndpoint = queryString
			? `${baseUrl}?${queryString}`
			: baseUrl;

		return fullEndpoint;
	}, [filters, user?.region, timeFilter]);

	const { data, error, isLoading } = useSWR<ApiResponse>(
		endpoint,
		authFetcher
	);

	if (isLoading) return <div>Loading chart...</div>;
	if (error)
		return <div className="text-red-500">Failed to load chart data</div>;
	if (!data || !data.summary) return null;

	// Color coding function
	const getSatisfactionColor = (percentage: number) => {
		if (percentage >= 80) return "#22c55e"; // Green
		if (percentage >= 50) return "#eab308"; // Yellow
		return "#ef4444"; // Red
	};

	// Format month labels for last_12_months
	const formatMonthLabel = (monthStr: string) => {
		const [year, month] = monthStr.split("-");
		const monthNames = [
			"Jan",
			"Feb",
			"Mar",
			"Apr",
			"May",
			"Jun",
			"Jul",
			"Aug",
			"Sep",
			"Oct",
			"Nov",
			"Dec",
		];
		return `${monthNames[parseInt(month) - 1]} ${year}`;
	};

	// Handle last_12_months data with line chart
	if (timeFilter === "last_12_months") {
		const monthlyData = data.summary.last_12_months;
		if (!monthlyData.labels || !monthlyData.percentages) {
			return (
				<div className="text-gray-500">
					No monthly data available
				</div>
			);
		}

		// Transform monthly data for line chart
		const chartData = monthlyData.labels.map((month, index) => ({
			month: formatMonthLabel(month),
			monthShort:
				month.split("-")[1] + "/" + month.split("-")[0].slice(2), // "05/24" format
			satisfaction_percentage: monthlyData.percentages[index],
		}));

		return (
			<div className="h-[400px] mt-4">
				<ResponsiveContainer
					width="100%"
					height="100%"
				>
					<LineChart
						data={chartData}
						margin={{
							top: 20,
							right: 30,
							left: 20,
							bottom: 60,
						}}
					>
						<CartesianGrid
							strokeDasharray="3 3"
							stroke="#e5e7eb"
						/>
						<XAxis
							dataKey="monthShort"
							angle={-45}
							textAnchor="end"
							height={80}
							tick={{ fontSize: 11 }}
							interval={0}
						/>
						<YAxis
							domain={[0, 100]}
							tickFormatter={(value) => `${value}%`}
							label={{
								value: "Satisfaction Rate (%)",
								angle: -90,
								position: "insideLeft",
								style: { textAnchor: "middle" },
							}}
						/>
						<Tooltip
							formatter={(value: any) => [
								`${Number(value).toFixed(1)}%`,
								"Satisfaction Rate",
							]}
							labelFormatter={(label, payload) => {
								if (payload && payload[0]) {
									return `Month: ${payload[0].payload.month}`;
								}
								return `Month: ${label}`;
							}}
							contentStyle={{
								backgroundColor:
									"rgba(255, 255, 255, 0.95)",
								border: "1px solid #e5e7eb",
								borderRadius: "6px",
							}}
						/>
						<Line
							dataKey="satisfaction_percentage"
							stroke="#3b82f6"
							strokeWidth={3}
							dot={(props) => {
								const { cx, cy, payload } = props;
								const color = getSatisfactionColor(
									payload.satisfaction_percentage
								);
								return (
									<circle
										cx={cx}
										cy={cy}
										r={4}
										fill={color}
										stroke={color}
										strokeWidth={2}
									/>
								);
							}}
							activeDot={{
								r: 6,
								strokeWidth: 2,
							}}
						/>
					</LineChart>
				</ResponsiveContainer>
			</div>
		);
	}

	// Regular summary data for other time periods - bar chart
	const summaryEntries = Object.entries(data.summary).filter(
		([key]) => key !== "last_12_months"
	) as [string, TimeBasedSummary][];

	const chartData = summaryEntries.map(([period, summary]) => {
		const formattedPeriod = period
			.replace(/_/g, " ")
			.replace(/\b\w/g, (l) => l.toUpperCase());
		return {
			period: formattedPeriod,
			satisfaction_percentage: summary.satisfaction_percentage,
			total_clients: summary.total_clients,
			satisfied_clients: summary.satisfied_clients,
		};
	});

	return (
		<div className="h-[400px] mt-4">
			<ResponsiveContainer
				width="100%"
				height="100%"
			>
				<BarChart
					data={chartData}
					margin={{
						top: 20,
						right: 30,
						left: 20,
						bottom: 60,
					}}
					barSize={50}
				>
					<CartesianGrid
						strokeDasharray="3 3"
						vertical={false}
						stroke="#e5e7eb"
					/>
					<XAxis
						dataKey="period"
						angle={-45}
						textAnchor="end"
						height={80}
						tick={{ fontSize: 11 }}
						interval={0}
					/>
					<YAxis
						domain={[0, 100]}
						tickFormatter={(value) => `${value}%`}
						label={{
							value: "Satisfaction Rate (%)",
							angle: -90,
							position: "insideLeft",
							style: { textAnchor: "middle" },
						}}
					/>
					<Tooltip
						formatter={(
							value: any,
							name: any,
							props: any
						) => {
							return [
								`${Number(value).toFixed(1)}%`,
								"Satisfaction Rate",
							];
						}}
						labelFormatter={(label) => `Period: ${label}`}
						contentStyle={{
							backgroundColor: "rgba(255, 255, 255, 0.95)",
							border: "1px solid #e5e7eb",
							borderRadius: "6px",
						}}
					/>
					<Bar
						dataKey="satisfaction_percentage"
						name="Satisfaction Rate"
						radius={[4, 4, 0, 0]}
					>
						{chartData.map((entry, index) => (
							<Cell
								key={`cell-${index}`}
								fill={getSatisfactionColor(
									entry.satisfaction_percentage
								)}
								stroke={getSatisfactionColor(
									entry.satisfaction_percentage
								)}
								strokeWidth={1}
							/>
						))}
						<LabelList
							dataKey="satisfaction_percentage"
							position="top"
							formatter={(value: number) =>
								`${value.toFixed(1)}%`
							}
							style={{
								fontSize: 11,
								fill: "#374151",
								fontWeight: "600",
							}}
						/>
					</Bar>
				</BarChart>
			</ResponsiveContainer>
		</div>
	);
}
