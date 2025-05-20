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

interface ChartProps {
	filters?: LocationFilterValues;
}

function FacilityLevelBarChart({ filters }: ChartProps) {
	// Get user from auth context
	const { user } = useAuth();

	// Build the endpoint URL with filters
	const endpoint = useMemo(() => {
		const baseUrl = `${BASE_URL}/level`;
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

		const queryString = params.toString();
		const fullEndpoint = queryString
			? `${baseUrl}?${queryString}`
			: baseUrl;

		// Debug logging to verify filters are being applied
		console.log(
			"FacilityLevelChart Endpoint:",
			fullEndpoint,
			"Filters:",
			filters
		);

		return fullEndpoint;
	}, [filters, user?.region]);

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

	// Vibrant color palette
	const palette = [
		"#22c55e", // green
		"#ef4444", // red
		"#3b82f6", // blue
		"#f97316", // orange
		"#a21caf", // purple
		"#facc15", // yellow
		"#0ea5e9", // cyan
		"#eab308", // gold
		"#6366f1", // indigo
		"#14b8a6", // teal
	];

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
								fill={palette[idx % palette.length]}
							/>
						)
					)}
				</Bar>
			</BarChart>
		</ResponsiveContainer>
	);
}

function ServiceUnitBarChart({ filters }: ChartProps) {
	// Get user from auth context
	const { user } = useAuth();

	// Build the endpoint URL with filters
	const endpoint = useMemo(() => {
		const baseUrl = `${BASE_URL}/service_point`;
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

		const queryString = params.toString();
		const fullEndpoint = queryString
			? `${baseUrl}?${queryString}`
			: baseUrl;

		// Debug logging to verify filters are being applied
		console.log(
			"ServiceUnitChart Endpoint:",
			fullEndpoint,
			"Filters:",
			filters
		);

		return fullEndpoint;
	}, [filters, user?.region]);

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
	// Use the same palette as above
	const palette = [
		"#22c55e", // green
		"#facc15", // yellow
		"#ef4444", // red
		"#3b82f6", // blue
		"#a21caf", // purple
		"#f97316", // orange
		"#0ea5e9", // cyan
		"#eab308", // gold
		"#6366f1", // indigo
		"#14b8a6", // teal
	];
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
						(entry: { value: number }, idx: number) => (
							<Cell
								key={`cell-service-${idx}`}
								fill={palette[idx % palette.length]}
							/>
						)
					)}
				</Bar>
			</BarChart>
		</ResponsiveContainer>
	);
}

export function LeadsTable() {
	const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
	const [filters, setFilters] = useState<LocationFilterValues>({});

	const handleFilterChange = useCallback(
		(newFilters: LocationFilterValues) => {
			console.log("Filter changed in leads table:", newFilters);
			setFilters(newFilters);
		},
		[]
	);

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

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<CardTitle>
							Satisfaction rate by health facility level
						</CardTitle>
					</CardHeader>
					<CardContent>
						<FacilityLevelBarChart filters={filters} />
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardTitle>
							Satisfaction rate by service unit
						</CardTitle>
					</CardHeader>
					<CardContent>
						<ServiceUnitBarChart filters={filters} />
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
