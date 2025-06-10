"use client";

import { useMemo } from "react";
import useSWR from "swr";
import {
	ResponsiveContainer,
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	Legend,
	Bar,
	ComposedChart,
	TooltipProps,
	Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DASHBOARD_ENDPOINTS } from "@/lib/api-config";
import { authFetcher } from "@/lib/api-utils";
import { LocationFilterValues } from "@/components/filters/location-filter";
import { ExtendedLocationFilterValues } from "@/components/dashboard/filter-bar";
import { TrendingUp } from "lucide-react";
import { useAuth } from "@/app/context/auth-context";

// Extend the SatisfactionTrendData interface for new API format
interface SatisfactionTrendDataset {
	label: string;
	data: number[];
}

interface SatisfactionTrendData {
	status: string;
	filters_applied: {
		region: string | null;
		district: string | null;
		facility: string | null;
	};
	data: {
		summary: {
			today: {
				total_clients: number;
				satisfied_clients: number;
				satisfaction_percentage: number;
			};
			cumulative: {
				total_clients: number;
				satisfied_clients: number;
				satisfaction_percentage: number;
			};
		};
		trends: {
			by_month_year: {
				labels: string[];
				data: number[];
			};
			by_year: {
				labels: string[];
				data: number[];
			};
			by_month: {
				labels: string[];
				data: number[];
			};
			by_date: {
				labels: string[];
				data: number[];
			};
		};
	};
	labels?: string[];
	datasets?: SatisfactionTrendDataset[];
}

// Create a type for the props
interface SatisfactionTrendChartProps {
	filters?: ExtendedLocationFilterValues;
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, label }: TooltipProps<any, any>) => {
	if (active && payload && payload.length) {
		const clientCount = payload[0].value;
		const satisfactionRate = payload[1]?.value || 0;

		return (
			<div className="bg-white p-3 border border-gray-200 rounded-md shadow-sm">
				<p className="font-medium text-sm">{label}</p>
				<p className="text-sm text-blue-500">
					<span className="font-medium">Client Count:</span>{' '}
					{clientCount}
				</p>
				<p className="text-sm text-gray-600">
					<span className="font-medium">Satisfaction Rate:</span>{' '}
					{satisfactionRate}%
				</p>
				<p className="text-xs text-gray-500 mt-1 border-t pt-1">
					Based on feedback from {clientCount} clients
				</p>
			</div>
		);
	}
	return null;
};

// Add a function to get the bar color based on satisfaction value
const getBarColor = (value: number) => {
	if (value <= 50) return '#ef4444'; // red
	if (value <= 80) return '#facc15'; // yellow
	return '#22c55e'; // green
};

export function SatisfactionTrendChart({
	filters,
}: SatisfactionTrendChartProps) {
	// Get user from auth context
	const { user } = useAuth();

	// Build the endpoint URL with filters
	const endpoint = useMemo(() => {
		const baseUrl = 'https://csf.health.go.ug/api/satisfaction_trends';
		const params = new URLSearchParams();

		// If region filter is set, use that first
		if (filters?.region) {
			params.append("region", filters.region);
		} else if (user?.region) {
			params.append("region", user.region);
		}

		if (filters?.district) params.append("district", filters.district);
		if (filters?.facility) params.append("facility", filters.facility);

		// Set role parameter based on user's region
		if (user?.region) {
			params.append("role", "region");
		} else {
			params.append("role", "national");
		}

		// Only append time filter if explicitly selected
		let timePeriod = filters?.timePeriod;
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
				params.append(
					"date_from",
					selectedDate.toISOString().split("T")[0]
				);
				params.append(
					"date_to",
					selectedDate.toISOString().split("T")[0]
				);
			}
		}
		// Do NOT append time_filter=last_12_months by default

		const queryString = params.toString();
		return queryString ? `${baseUrl}?${queryString}` : baseUrl;
	}, [filters, user?.region]);

	// Fetch satisfaction trend data
	const { data, error, isLoading } = useSWR<SatisfactionTrendData>(
		endpoint,
		authFetcher
	);

	// Debug: Log the API data to the console
	if (typeof window !== 'undefined') {
		console.log('SatisfactionTrendChart API endpoint:', endpoint);
		console.log('SatisfactionTrendChart API data:', data);
	}

	// Transform API data to Recharts format
	const chartData = useMemo(() => {
		if (!data) return [];

		// Handle new format: { labels: [], datasets: [{ label, data: [] }, ...] }
		if (Array.isArray(data.labels) && Array.isArray(data.datasets)) {
			// Find the correct datasets
			const satisfactionDataset = data.datasets.find((ds: SatisfactionTrendDataset) => ds.label.toLowerCase().includes('satisfaction'));
			const clientCountDataset = data.datasets.find((ds: SatisfactionTrendDataset) => ds.label.toLowerCase().includes('client'));
			return data.labels.map((label: string, idx: number) => ({
				month: label,
				satisfaction: satisfactionDataset ? satisfactionDataset.data[idx] : null,
				clientCount: clientCountDataset ? clientCountDataset.data[idx] : null,
			}));
		}

		// Fallback for other formats (if any)
		return [];
	}, [data]);

	// Calculate max client count for right y-axis scaling
	const maxClientCount = useMemo(() => {
		if (!chartData.length) return 1000;
		// Filter out nulls before Math.max
		const clientCounts = chartData.map((item) => item.clientCount).filter((v): v is number => typeof v === 'number');
		if (!clientCounts.length) return 1000;
		return Math.max(...clientCounts) * 1.2;
	}, [chartData]);

	// Format month labels (e.g., '2024-07' to 'Jul 2024')
	const formatMonth = (monthStr: string) => {
		if (!monthStr) return "";
		const [year, month] = monthStr.split("-");
		const monthNames = [
			"Jan", "Feb", "Mar", "Apr", "May", "Jun",
			"Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
		];
		if (!month || !year) return monthStr;
		return `${monthNames[parseInt(month, 10) - 1]} ${year}`;
	};

	// Handle loading state
	if (isLoading) {
		return (
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">
						Trends in Client Satisfaction Rates
					</CardTitle>
					<TrendingUp className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent className="h-[350px] flex items-center justify-center">
					<div className="h-6 w-6 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
					<span className="ml-2 text-sm">Loading...</span>
				</CardContent>
			</Card>
		);
	}

	// Handle error state
	if (error) {
		return (
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">
						Trends in Client Satisfaction Rates
					</CardTitle>
					<TrendingUp className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent className="h-[350px] flex items-center justify-center text-red-500 text-sm">
					Error loading data
				</CardContent>
			</Card>
		);
	}

	// Handle empty data
	if (!data || chartData.length === 0) {
		return (
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-sm font-medium">
						Trends in Client Satisfaction Rates
					</CardTitle>
					<TrendingUp className="h-4 w-4 text-muted-foreground" />
				</CardHeader>
				<CardContent className="h-[350px] flex items-center justify-center text-muted-foreground text-sm">
					No trend data available
				</CardContent>
			</Card>
		);
	}

	// Render chart
	return (
		<Card>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="text-lg font-medium">
					Trends in Client Satisfaction Rates
				</CardTitle>
				<TrendingUp className="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				<div className="h-[350px]">
					<ResponsiveContainer width="100%" height="100%">
						<ComposedChart
							data={chartData}
							margin={{ top: 10, right: 30, left: 20, bottom: 50 }}
						>
							<CartesianGrid strokeDasharray="3 3" opacity={0.3} />
							<XAxis
								dataKey="month"
								stroke="#888888"
								fontSize={12}
								tickLine={false}
								axisLine={false}
								angle={-45}
								textAnchor="end"
								height={70}
							/>
							<YAxis
								yAxisId="left"
								tickFormatter={(value) => `${value}%`}
								domain={[0, 100]}
								stroke="#888888"
								fontSize={12}
								tickLine={false}
								axisLine={false}
								width={40}
								label={{
									value: "Satisfaction Rate (%)",
									angle: -90,
									position: "insideLeft",
									style: { textAnchor: "middle" },
								}}
							/>
							<YAxis
								yAxisId="right"
								orientation="right"
								stroke="#eab308"
								domain={[0, maxClientCount]}
								fontSize={12}
								tickLine={false}
								axisLine={false}
								width={80}
								label={{
									value: "Number of Clients",
									angle: 90,
									position: "insideRight",
									style: {
										textAnchor: "middle",
										fill: "#eab308",
									},
								}}
							/>
							<Tooltip />
							<Legend verticalAlign="top" height={36} />
							<Bar
								yAxisId="left"
								dataKey="satisfaction"
								name="Satisfaction Rate (%)"
								barSize={20}
								fill="#0ea5e9"
							/>
							<Line
								yAxisId="right"
								type="monotone"
								dataKey="clientCount"
								stroke="#eab308"
								strokeWidth={3}
								dot={false}
								activeDot={{ r: 7 }}
								name="Client Count"
							/>
						</ComposedChart>
					</ResponsiveContainer>
				</div>
			</CardContent>
		</Card>
	);
}
