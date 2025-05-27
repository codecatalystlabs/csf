"use client";

import { useState, useMemo, useCallback } from "react";
import { MoreHorizontal, ChevronDown, Search, ArrowUpDown } from "lucide-react";
import useSWR from "swr";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	Cell,
} from "recharts";

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
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader } from "@/components/ui/loader";
import { BASE_URL } from "@/lib/api-config";
import { useAuth } from "@/app/context/auth-context";
import { LocationFilterValues } from "@/components/filters/location-filter";
import { FilterBar } from "@/components/dashboard/filter-bar";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

type TimePeriod =
	| "today"
	| "this_month"
	| "last_month"
	| "cumulative"
	| "custom_year_range"
	| "last_year"
	| "this_year"
	| "current_quarter"
	| "previous_quarter";

interface ChartProps {
	filters?: LocationFilterValues;
	timeFilter?: TimePeriod;
}

function FacilityLevelBarChart({ filters, timeFilter }: ChartProps) {
	// Get user from auth context
	const { user } = useAuth();

	// Build the endpoint URL with filters
	const endpoint = useMemo(() => {
		const baseUrl = `${BASE_URL}/level`;
		const params = new URLSearchParams();

		// Add time filter parameter
		if (timeFilter) {
			params.append("time_filter", timeFilter);
		} else {
			params.append("time_filter", "cumulative");
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
			"FacilityLevelChart Endpoint:",
			fullEndpoint,
			"Filters:",
			filters,
			"TimeFilter:",
			timeFilter
		);

		return fullEndpoint;
	}, [filters, user?.region, timeFilter]);

	const { data, error, isLoading } = useSWR(endpoint, fetcher);

	if (isLoading)
		return (
			<div className="flex items-center justify-center h-64">
				<Loader text="Loading chart data..." />
			</div>
		);
	if (error) return <div className="text-red-500">Failed to load data</div>;
	if (!data) return null;

	// Transform data for recharts
	const chartData = data.labels.map((label: string, i: number) => ({
		name: label.replace(/_/g, " "),
		value: Number(data.data[i]),
	}));

	// Color logic based on satisfaction rate
	const getSatisfactionColor = (value: number) => {
		if (value >= 80) return "#22c55e"; // Green for satisfied (80-100%)
		if (value >= 50) return "#eab308"; // Yellow for neutral (50-80%)
		return "#ef4444"; // Red for dissatisfied (0-50%)
	};

	return (
		<ResponsiveContainer
			width="100%"
			height={350}
		>
			<BarChart
				data={chartData}
				layout="vertical"
				margin={{ top: 20, right: 40, left: 120, bottom: 20 }}
				barSize={35}
			>
				<CartesianGrid
					strokeDasharray="3 3"
					horizontal={true}
					vertical={false}
				/>
				<XAxis
					type="number"
					domain={[0, 100]}
					tickFormatter={(v) => `${v}%`}
				/>
				<YAxis
					type="category"
					dataKey="name"
					width={110}
					tick={{ fontSize: 12 }}
				/>
				<Tooltip
					formatter={(v: number) => [
						`${v}%`,
						"Satisfaction Rate",
					]}
					contentStyle={{
						border: "1px solid #ccc",
						borderRadius: "4px",
						backgroundColor: "#fff",
					}}
				/>
				<Bar
					dataKey="value"
					isAnimationActive={true}
					animationDuration={800}
				>
					{chartData.map(
						(
							entry: { name: string; value: number },
							idx: number
						) => (
							<Cell
								key={`cell-${idx}`}
								fill={getSatisfactionColor(entry.value)}
							/>
						)
					)}
				</Bar>
			</BarChart>
		</ResponsiveContainer>
	);
}

function ServiceUnitBarChart({ filters, timeFilter }: ChartProps) {
	// Get user from auth context
	const { user } = useAuth();

	// Build the endpoint URL with filters
	const endpoint = useMemo(() => {
		const baseUrl = `${BASE_URL}/service_point`;
		const params = new URLSearchParams();

		// Add time filter parameter
		if (timeFilter) {
			params.append("time_filter", timeFilter);
		} else {
			params.append("time_filter", "cumulative");
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
			"ServiceUnitChart Endpoint:",
			fullEndpoint,
			"Filters:",
			filters,
			"TimeFilter:",
			timeFilter
		);

		return fullEndpoint;
	}, [filters, user?.region, timeFilter]);

	const { data, error, isLoading } = useSWR(endpoint, fetcher);

	if (isLoading)
		return (
			<div className="flex items-center justify-center h-64">
				<Loader text="Loading chart data..." />
			</div>
		);
	if (error) return <div className="text-red-500">Failed to load data</div>;
	if (!data) return null;
	// Transform data for recharts
	const chartData = data.labels.map((label: string, i: number) => ({
		name: label.replace(/_/g, " "),
		value: Number(data.data[i]),
	}));

	// Color logic based on satisfaction rate
	const getSatisfactionColor = (value: number) => {
		if (value >= 80) return "#22c55e"; // Green for satisfied (80-100%)
		if (value >= 50) return "#eab308"; // Yellow for neutral (50-80%)
		return "#ef4444"; // Red for dissatisfied (0-50%)
	};

	return (
		<ResponsiveContainer
			width="100%"
			height={350}
		>
			<BarChart
				data={chartData}
				layout="vertical"
				margin={{ top: 20, right: 30, left: 40, bottom: 20 }}
				barCategoryGap={20}
			>
				<CartesianGrid strokeDasharray="3 3" />
				<XAxis
					type="number"
					domain={[0, 100]}
					tickFormatter={(v) => `${v}%`}
				/>
				<YAxis
					type="category"
					dataKey="name"
					width={180}
				/>
				<Tooltip formatter={(v: number) => `${v}%`} />
				<Bar
					dataKey="value"
					isAnimationActive={false}
					fill="#888"
				>
					{chartData.map(
						(
							entry: { name: string; value: number },
							idx: number
						) => (
							<Cell
								key={`cell-service-${idx}`}
								fill={getSatisfactionColor(entry.value)}
							/>
						)
					)}
				</Bar>
			</BarChart>
		</ResponsiveContainer>
	);
}

// Add the UgandanFlagRibbon component
function UgandanFlagRibbon() {
	return (
		<div className="w-full">
			<div className="h-1 bg-[#000000] w-full"></div>
			<div className="h-1 bg-[#FCDC3B] w-full"></div>
			<div className="h-1 bg-[#DA291C] w-full"></div>
			<div className="h-1 bg-[#000000] w-full"></div>
			<div className="h-1 bg-[#FCDC3B] w-full"></div>
			<div className="h-1 bg-[#DA291C] w-full"></div>
		</div>
	);
}

export function LeadsTable() {
	const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
	const [filters, setFilters] = useState<LocationFilterValues>({});
	const [timePeriod, setTimePeriod] = useState<TimePeriod>("this_month");

	const handleFilterChange = useCallback(
		(newFilters: LocationFilterValues) => {
			console.log("Filter changed in leads table:", newFilters);
			setFilters(newFilters);
		},
		[]
	);

	const handlePeriodChange = (period: TimePeriod) => {
		setTimePeriod(period);
	};

	const toggleSelectLead = (id: string) => {
		if (selectedLeads.includes(id)) {
			setSelectedLeads(
				selectedLeads.filter((leadId) => leadId !== id)
			);
		} else {
			setSelectedLeads([...selectedLeads, id]);
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "New":
				return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
			case "Contacted":
				return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
			case "Qualified":
				return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
			default:
				return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
		}
	};

	return (
		<div className="space-y-6">
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

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle>
							Satisfaction rate by health facility level
						</CardTitle>
					</CardHeader>
					<CardContent>
						<FacilityLevelBarChart
							filters={filters}
							timeFilter={timePeriod}
						/>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>
							Satisfaction rate by service unit
						</CardTitle>
					</CardHeader>
					<CardContent>
						<ServiceUnitBarChart
							filters={filters}
							timeFilter={timePeriod}
						/>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
