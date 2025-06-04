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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

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
	| "last_12_months"
	| "by_date";

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
	{ value: "Q1", label: "Q1 (Jan-Mar)" },
	{ value: "Q2", label: "Q2 (Apr-Jun)" },
	{ value: "Q3", label: "Q3 (Jul-Sep)" },
	{ value: "Q4", label: "Q4 (Oct-Dec)" },
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

export function SatisfactionTrendsWithFilters() {
	const [filters, setFilters] = useState<LocationFilterValues>({});
	const [timePeriod, setTimePeriod] = useState<TimePeriod>("last_12_months");

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
	const [selectedMonth, setSelectedMonth] = useState("");
	const [selectedQuarter, setSelectedQuarter] = useState("");
	const [selectedYear, setSelectedYear] = useState("");
	const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

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

			{/* Time Filters UI */}
			<div className="flex flex-wrap gap-2 items-center mb-4">
				<Button
					variant={timePeriod === "today" ? "default" : "outline"}
					onClick={() => {
						setTimePeriod("today");
						setSelectedYear("");
						setSelectedMonth("");
						setSelectedQuarter("");
						setSelectedDate(undefined);
					}}
					size="sm"
				>
					Today
				</Button>
				{/* Month Dropdown (enabled if year is selected) */}
				<Select value={selectedMonth} onValueChange={(value) => {
					setSelectedMonth(value);
					setTimePeriod("this_month");
					setSelectedQuarter("");
					setSelectedDate(undefined);
				}} disabled={!selectedYear}>
					<SelectTrigger className="w-[120px]">
						<SelectValue placeholder="Month" />
					</SelectTrigger>
					<SelectContent>
						{months.map((month) => (
							<SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>
						))}
					</SelectContent>
				</Select>
				{/* Quarter Dropdown (enabled if year is selected) */}
				<Select value={selectedQuarter} onValueChange={(value) => {
					setSelectedQuarter(value);
					setTimePeriod("current_quarter");
					setSelectedMonth("");
					setSelectedDate(undefined);
				}} disabled={!selectedYear || !!selectedMonth}>
					<SelectTrigger className="w-[120px]">
						<SelectValue placeholder="Quarter" />
					</SelectTrigger>
					<SelectContent>
						{quarters.map((q) => (
							<SelectItem key={q.value} value={q.value}>{q.label}</SelectItem>
						))}
					</SelectContent>
				</Select>
				{/* Year Dropdown */}
				<Select value={selectedYear} onValueChange={(value) => {
					setSelectedYear(value);
					setTimePeriod("this_year");
					setSelectedMonth("");
					setSelectedQuarter("");
					setSelectedDate(undefined);
				}}>
					<SelectTrigger className="w-[120px]">
						<SelectValue placeholder="Year" />
					</SelectTrigger>
					<SelectContent>
						{availableYears.map((year) => (
							<SelectItem key={year} value={year.toString()}>{year}</SelectItem>
						))}
					</SelectContent>
				</Select>
				<Button
					variant={timePeriod === "cumulative" ? "default" : "outline"}
					onClick={() => {
						setTimePeriod("cumulative");
						setSelectedYear("");
						setSelectedMonth("");
						setSelectedQuarter("");
						setSelectedDate(undefined);
					}}
					size="sm"
				>
					Cumulative
				</Button>
				{/* Calendar for date selection as a popover */}
				<Popover>
					<PopoverTrigger asChild>
						<Button
							variant="outline"
							className={cn(
								"w-[220px] justify-start text-left font-normal",
								!selectedDate && "text-muted-foreground"
							)}
						>
							{selectedDate ? selectedDate.toLocaleDateString() : "Pick a date"}
						</Button>
					</PopoverTrigger>
					<PopoverContent className="w-auto p-0">
						<Calendar
							mode="single"
							selected={selectedDate}
							onSelect={(date) => {
								setSelectedDate(date);
								setTimePeriod("by_date" as TimePeriod);
								setSelectedYear("");
								setSelectedMonth("");
								setSelectedQuarter("");
							}}
							className="rounded-md border"
						/>
					</PopoverContent>
				</Popover>
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
		} else if (user?.region) {
			params.append("region", user.region);
		}
		if (filters?.district) {
			params.append("district", filters.district);
		}
		if (filters?.facility) {
			params.append("facility", filters.facility);
		}
		if (user?.region) {
			params.append("role", "region");
		} else {
			params.append("role", "national");
		}
		const queryString = params.toString();
		const fullEndpoint = queryString ? `${baseUrl}?${queryString}` : baseUrl;
		return fullEndpoint;
	}, [filters, user?.region, timeFilter]);

	const { data, error, isLoading } = useSWR<any>(endpoint, authFetcher);

	// Handle loading state
	if (isLoading) return <div>Loading chart...</div>;
	if (error) return <div className="text-red-500">Failed to load chart data</div>;
	if (!data || !data.labels || !data.datasets || !data.datasets[0]) return null;

	// Transform the data for Recharts
	const chartData = data.labels.map((label: string, idx: number) => ({
		label, // e.g., "2024-07"
		value: data.datasets[0].data[idx],
	}));

	// Optional: Format month labels (e.g., "2024-07" to "Jul 2024")
	const formatMonth = (monthStr: string) => {
		const [year, month] = monthStr.split("-");
		const monthNames = [
			"Jan", "Feb", "Mar", "Apr", "May", "Jun",
			"Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
		];
		return `${monthNames[parseInt(month, 10) - 1]} ${year}`;
	};

	return (
		<div className="h-[400px] mt-4">
			<ResponsiveContainer width="100%" height="100%">
				<LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
					<CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
					<XAxis
						dataKey="label"
						tickFormatter={formatMonth}
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
					<Tooltip formatter={(v) => `${v}%`} labelFormatter={formatMonth} />
					<Line
						type="monotone"
						dataKey="value"
						stroke="#3b82f6"
						strokeWidth={3}
						dot={{ r: 4 }}
						activeDot={{ r: 6 }}
						name="Satisfaction Rate (%)"
					/>
				</LineChart>
			</ResponsiveContainer>
		</div>
	);
}
