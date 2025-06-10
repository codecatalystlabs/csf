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
import { ExtendedLocationFilterValues } from "@/components/dashboard/filter-bar";
import { FilterBar } from "@/components/dashboard/filter-bar";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

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
	| "previous_quarter"
	| "by_date";

interface ChartProps {
	filters?: ExtendedLocationFilterValues;
	timeFilter?: TimePeriod;
}

function FacilityLevelBarChart({ filters, timeFilter }: ChartProps) {
	// Get user from auth context
	const { user } = useAuth();

	// Build the endpoint URL with filters
	const endpoint = useMemo(() => {
		const baseUrl = `${BASE_URL}/level`;
		const params = new URLSearchParams();

		// Use filters.timePeriod instead of timeFilter for consistency
		const timePeriod = filters?.timePeriod || timeFilter || "cumulative";
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
	if (
		!data ||
		!data.labels ||
		!Array.isArray(data.labels) ||
		!data.data ||
		!Array.isArray(data.data)
	) {
		return (
			<div className="flex items-center justify-center h-64 text-muted-foreground">
				No chart data available
			</div>
		);
	}

	// Transform data for recharts
	let chartData = [];
	if (data.labels && Array.isArray(data.labels) && data.data && Array.isArray(data.data)) {
		chartData = data.labels.map((label: string, i: number) => ({
			name: label.replace(/_/g, " "),
			value: Number(data.data?.[i] || 0),
		}));
	} else if (data && typeof data.data === 'object' && !Array.isArray(data.data)) {
		chartData = Object.entries(data.data).map(([label, value]) => ({
			name: label.replace(/_/g, " "),
			value: Number(value || 0),
		}));
	}

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
				margin={{ top: 20, right: 30, left: 40, bottom: 60 }}
				barSize={35}
			>
				<CartesianGrid
					strokeDasharray="3 3"
					vertical={false}
				/>
				<XAxis
					type="category"
					dataKey="name"
					angle={-45}
					textAnchor="end"
					height={80}
					tick={{ fontSize: 12 }}
				/>
				<YAxis
					type="number"
					domain={[0, 100]}
					tickFormatter={(v) => `${v}%`}
					label={{
						value: "Satisfaction Rate (%)",
						angle: -90,
						position: "insideLeft",
						style: { textAnchor: "middle" },
					}}
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
					{chartData.map((entry, idx) => (
						<Cell key={`cell-${idx}`} fill={getSatisfactionColor(entry.value)} />
					))}
				</Bar>
			</BarChart>
		</ResponsiveContainer>
	);
}

function ServiceUnitSatisfactionTable({ filters, timeFilter }: ChartProps) {
	const { user } = useAuth();

	const endpoint = useMemo(() => {
		const baseUrl = `${BASE_URL}/service_point`;
		const params = new URLSearchParams();

		// Add time filter parameters
		const timePeriod = filters?.timePeriod || timeFilter || "cumulative";
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
			params.append("time_filter", "cumulative");
		}

		// Add location filters
		if (filters?.region) params.append("region", filters.region);
		if (filters?.district) params.append("district", filters.district);
		if (filters?.facility) params.append("facility", filters.facility);

		// Set role parameter based on user's region
		if (user?.region) {
			params.append("role", "region");
		} else {
			params.append("role", "national");
		}

		const queryString = params.toString();
		return queryString ? `${baseUrl}?${queryString}` : baseUrl;
	}, [filters, user?.region, timeFilter]);

	const { data, error, isLoading } = useSWR(endpoint, fetcher);

	if (isLoading)
		return (
			<div className="flex items-center justify-center h-64">
				<Loader text="Loading table data..." />
			</div>
		);
	if (error) return <div className="text-red-500">Failed to load data</div>;
	if (
		!data ||
		!Array.isArray(data.data)
	) {
		return (
			<div className="flex items-center justify-center h-64 text-muted-foreground">
				No table data available
			</div>
		);
	}

	console.log("Service Point Table API data:", data);

	const tableData = data.data
		.filter((item: any) => !!item.servicepoint)
		.map((item: any) => ({
			name: (item.servicepoint || "").replace(/_/g, " "),
			value: Number(item.percentage || 0),
		}));

	const getSatisfactionColor = (value: number) => {
		if (value >= 80) return "text-green-600";
		if (value >= 50) return "text-yellow-600";
		return "text-red-600";
	};

	return (
		<div className="overflow-x-auto">
			<table className="min-w-full border-collapse border border-gray-300">
				<thead>
					<tr>
						<th className="border border-gray-300 px-4 py-2 bg-gray-100 text-left text-sm font-medium">
							Service Unit
						</th>
						<th className="border border-gray-300 px-4 py-2 bg-gray-100 text-center text-sm font-medium">
							Satisfaction Rate
						</th>
					</tr>
				</thead>
				<tbody>
					{tableData.map(
						(
							row: { name: string; value: number },
							idx: number
						) => (
							<tr
								key={row.name}
								className="hover:bg-gray-50"
							>
								<td className="border border-gray-300 px-4 py-2 font-medium">
									{row.name}
								</td>
								<td
									className={`border border-gray-300 px-4 py-2 text-center font-semibold ${getSatisfactionColor(
										row.value
									)}`}
								>
									{row.value.toFixed(1)}%
								</td>
							</tr>
						)
					)}
				</tbody>
			</table>
		</div>
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

export function LeadsTable() {
	const [selectedLeads, setSelectedLeads] = useState<string[]>([]);
	const [filters, setFilters] = useState<ExtendedLocationFilterValues>({});
	const [timePeriod, setTimePeriod] = useState<TimePeriod>("this_month");
	const [selectedMonth, setSelectedMonth] = useState("");
	const [selectedQuarter, setSelectedQuarter] = useState("");
	const [selectedYear, setSelectedYear] = useState("");
	const [selectedDate, setSelectedDate] = useState<Date | undefined>(
		undefined
	);

	const handleFilterChange = useCallback(
		(newFilters: ExtendedLocationFilterValues) => {
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

			<div className="space-y-6">
				{/* <Card>
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
				</Card> */}
				<Card>
					<CardHeader>
						<CardTitle>
							Satisfaction rate by service unit
						</CardTitle>
					</CardHeader>
					<CardContent>
						{/* Time Filters UI for Service Point Table */}
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
							<Select value={selectedMonth} onValueChange={(value) => {
								setSelectedMonth(value);
								setTimePeriod("by_month_year");
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
							<Select value={selectedQuarter} onValueChange={(value) => {
								setSelectedQuarter(value);
								setTimePeriod("by_quarter_year");
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
							<Select value={selectedYear} onValueChange={(value) => {
								setSelectedYear(value);
								setTimePeriod("by_year");
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
											setTimePeriod("by_date");
											setSelectedYear("");
											setSelectedMonth("");
											setSelectedQuarter("");
										}}
										className="rounded-md border"
									/>
								</PopoverContent>
							</Popover>
						</div>
						<ServiceUnitSatisfactionTable
							filters={{
								...filters,
								timePeriod,
								selectedYear,
								selectedMonth,
								selectedQuarter,
								selectedDate,
							}}
							timeFilter={timePeriod}
						/>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
