"use client";

import React, { useMemo, useState, useCallback } from "react";
import useSWR from "swr";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader } from "@/components/ui/loader";
import { BASE_URL } from "@/lib/api-config";
import { ThumbsDown, AlertTriangle } from "lucide-react";
import { useAuth } from "@/app/context/auth-context";
import { LocationFilterValues } from "@/components/filters/location-filter";
import { FilterBar } from "@/components/dashboard/filter-bar";
import {
	BarChart,
	Bar,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	Cell,
	Legend,
	LabelList,
	Line,
} from "recharts";

// Fetcher function for the SWR hook
const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Define the type for dissatisfaction factor data
interface DissatisfactionFactor {
	factor: string;
	count: number;
	percentage: number;
	cumulative_percentage: number;
}

// Define the type for bribe data
interface BribeData {
	labels: string[];
	datasets: {
		label: string;
		backgroundColor: string;
		borderColor: string;
		data: number[];
	}[];
}

interface BribeByRegionChartProps {
	filters?: LocationFilterValues;
}

export function BribeByRegionChart({ filters }: BribeByRegionChartProps) {
	// Get user from auth context
	const { user } = useAuth();

	// Build the endpoint URL with filters
	const endpoint = useMemo(() => {
		const baseUrl = `${BASE_URL}/bribe`;
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
			"BribeChart Endpoint:",
			fullEndpoint,
			"Filters:",
			filters
		);

		return fullEndpoint;
	}, [filters, user?.region]);

	const { data, error, isLoading } = useSWR<BribeData>(endpoint, fetcher);

	if (isLoading)
		return (
			<div className="h-96 flex items-center justify-center">
				<Loader
					size="lg"
					text="Loading bribe data by region..."
				/>
			</div>
		);
	if (error)
		return <div className="text-red-500">Failed to load bribe data</div>;
	if (!data) return null;

	// Transform the API data into the format needed for recharts
	const chartData = data.labels.map((region, index) => ({
		region,
		surveyed: data.datasets[0].data[index],
		reported: data.datasets[1].data[index],
		percentage: data.datasets[2].data[index],
	}));

	// Sort data by percentage in descending order
	const sortedData = [...chartData].sort(
		(a, b) => b.percentage - a.percentage
	);

	return (
		<div className="space-y-4 mt-8">
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-lg font-medium">
						Bribe Payment by Region
					</CardTitle>
					<AlertTriangle className="h-5 w-5 text-amber-500" />
				</CardHeader>
				<CardContent>
					<div className="h-[500px] mt-4">
						<ResponsiveContainer
							width="100%"
							height="100%"
						>
							<BarChart
								data={sortedData}
								margin={{
									top: 20,
									right: 30,
									left: 20,
									bottom: 100,
								}}
								barSize={25}
								barGap={0}
							>
								<CartesianGrid
									strokeDasharray="3 3"
									vertical={false}
								/>
								<XAxis
									dataKey="region"
									angle={-45}
									textAnchor="end"
									height={100}
									tick={{ fontSize: 12 }}
									interval={0}
								/>
								<YAxis
									yAxisId="left"
									orientation="left"
									label={{
										value: "Number of Clients",
										angle: -90,
										position: "insideLeft",
										style: {
											textAnchor: "middle",
										},
									}}
								/>
								<YAxis
									yAxisId="right"
									orientation="right"
									domain={[0, 10]}
									tickFormatter={(value) =>
										`${value}%`
									}
									label={{
										value: "Percentage",
										angle: 90,
										position: "insideRight",
										style: {
											textAnchor: "middle",
										},
									}}
								/>
								<Tooltip
									formatter={(value, name) => {
										if (name === "surveyed")
											return [
												`${value} clients`,
												"Clients Surveyed",
											];
										if (name === "reported")
											return [
												`${value} clients`,
												"Reported Paying Bribes",
											];
										if (name === "percentage")
											return [
												`${value}%`,
												"% Clients Reported Paying Bribes",
											];
										return [value, name];
									}}
								/>
								<Legend verticalAlign="top" />
								<Bar
									yAxisId="left"
									dataKey="surveyed"
									name="Clients Surveyed"
									fill="rgba(78, 115, 223, 0.5)"
									stroke="rgba(78, 115, 223, 1)"
									isAnimationActive={true}
								/>
								<Bar
									yAxisId="left"
									dataKey="reported"
									name="Reported Paying Bribes"
									fill="rgba(28, 200, 138, 0.5)"
									stroke="rgba(28, 200, 138, 1)"
									isAnimationActive={true}
								/>
								<Line
									yAxisId="right"
									type="monotone"
									dataKey="percentage"
									name="% Clients Reported Paying Bribes"
									stroke="rgba(54, 185, 204, 1)"
									strokeWidth={2}
									dot={{
										fill: "rgba(54, 185, 204, 1)",
										r: 4,
									}}
									isAnimationActive={true}
								>
									<LabelList
										dataKey="percentage"
										position="top"
										formatter={(value: any) =>
											typeof value === "number"
												? `${value.toFixed(
														1
												  )}%`
												: `${value}%`
										}
										style={{
											fontSize: 10,
											fill: "rgba(54, 185, 204, 1)",
										}}
									/>
								</Line>
							</BarChart>
						</ResponsiveContainer>
					</div>
					<div className="mt-4 pt-2 border-t">
						<div className="text-sm">
							<p>
								This chart shows the number of clients
								surveyed and those who reported paying
								bribes across different regions, along
								with the percentage of clients who
								reported paying bribes in each region.
							</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

interface DissatisfactionParetoChartProps {
	filters?: LocationFilterValues;
}

export function DissatisfactionParetoChart({
	filters,
}: DissatisfactionParetoChartProps) {
	// Get user from auth context
	const { user } = useAuth();

	// Build the endpoint URL with filters
	const endpoint = useMemo(() => {
		const baseUrl = `${BASE_URL}/dissatisfaction_pareto`;
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
			"DissatisfactionPareto Endpoint:",
			fullEndpoint,
			"Filters:",
			filters
		);

		return fullEndpoint;
	}, [filters, user?.region]);

	const { data, error, isLoading } = useSWR(endpoint, fetcher);

	if (isLoading)
		return (
			<div className="h-96 flex items-center justify-center">
				<Loader
					size="lg"
					text="Loading dissatisfaction data..."
				/>
			</div>
		);
	if (error) return <div className="text-red-500">Failed to load data</div>;
	if (!data) return null;

	// Sort data by count in descending order
	const sortedData = [...data.data].sort((a, b) => b.count - a.count);

	// Find the threshold for 80% cumulative
	const thresholdIndex = sortedData.findIndex(
		(item) => item.cumulative_percentage > 80
	);

	// Transform data for recharts - include both count and cumulative data
	const chartData = sortedData.map((item, index) => ({
		factor: item.factor,
		count: item.count,
		percentage: item.percentage,
		cumulative: item.cumulative_percentage,
		isTopFactor: index <= thresholdIndex,
	}));

	// Color palette for dissatisfaction factors
	const palette = [
		"#ef4444", // red
		"#f87171", // lighter red
		"#fb7185", // rose
		"#fda4af", // lighter rose
		"#fecdd3", // lightest rose
	];

	return (
		<div className="space-y-4">
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-lg font-medium">
						Factors contributing to 80% of client
						dissatisfaction
					</CardTitle>
					<ThumbsDown className="h-5 w-5 text-red-500" />
				</CardHeader>
				<CardContent>
					<div className="h-[500px] mt-4">
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
									bottom: 100,
								}}
								barSize={40}
								barGap={8}
							>
								<CartesianGrid
									strokeDasharray="3 3"
									vertical={true}
								/>
								<XAxis
									dataKey="factor"
									angle={-45}
									textAnchor="end"
									height={100}
									tick={{ fontSize: 12 }}
									interval={0}
								/>
								{/* Primary Y-axis for count/frequency */}
								<YAxis
									yAxisId="left"
									orientation="left"
									label={{
										value: "# of Poor Rating",
										angle: -90,
										position: "insideLeft",
										style: {
											textAnchor: "middle",
										},
									}}
									tickFormatter={(value) =>
										value.toString()
									}
								/>
								{/* Secondary Y-axis for cumulative percentage */}
								<YAxis
									yAxisId="right"
									orientation="right"
									domain={[0, 100]}
									tickFormatter={(value) =>
										`${value}%`
									}
									label={{
										value: "Cumulative (%)",
										angle: 90,
										position: "insideRight",
										style: {
											textAnchor: "middle",
										},
									}}
								/>
								<Tooltip
									formatter={(
										value,
										name,
										props
									) => {
										if (name === "count") {
											return [
												`${value} cases (${props.payload.percentage.toFixed(
													1
												)}%)`,
												"Count",
											];
										}
										if (name === "cumulative") {
											return [
												`${
													typeof value ===
													"number"
														? value.toFixed(
																1
														  )
														: value
												}%`,
												"Cumulative",
											];
										}
										return [value, name];
									}}
									cursor={{
										fill: "rgba(0, 0, 0, 0.05)",
									}}
								/>
								<Legend
									verticalAlign="top"
									align="right"
									wrapperStyle={{
										paddingBottom: "10px",
									}}
								/>
								{/* Bar chart for factor counts */}
								<Bar
									yAxisId="left"
									dataKey="count"
									name="Number of Cases"
									animationDuration={1000}
								>
									{chartData.map((entry, index) => (
										<Cell
											key={`cell-${index}`}
											fill={
												entry.isTopFactor
													? "#ef4444" // All red bars for top factors
													: "#3b82f6" // Blue for others
											}
										/>
									))}
									<LabelList
										dataKey="count"
										position="top"
										style={{
											fontSize: 12,
											fill: "#000",
											fontWeight: "bold",
										}}
									/>
								</Bar>
								{/* Line for cumulative percentage */}
								<Line
									yAxisId="right"
									type="monotone"
									dataKey="cumulative"
									stroke="#991b1b"
									strokeWidth={2}
									dot={{ fill: "#991b1b", r: 4 }}
									activeDot={{ r: 6 }}
									name="Cumulative %"
								>
									<LabelList
										dataKey="cumulative"
										position="top"
										formatter={(value: any) =>
											typeof value === "number"
												? `${value.toFixed(
														0
												  )}%`
												: `${value}%`
										}
										style={{
											fontSize: 10,
											fill: "#991b1b",
										}}
									/>
								</Line>
							</BarChart>
						</ResponsiveContainer>
					</div>
					<div className="mt-4 pt-2 border-t">
						<div className="flex items-center gap-6 text-sm">
							<div className="flex items-center">
								<div className="w-4 h-4 bg-red-500 rounded-sm mr-2"></div>
								<span>Top factors (80% of issues)</span>
							</div>
							<div className="flex items-center">
								<div className="w-4 h-4 bg-blue-500 rounded-sm mr-2"></div>
								<span>Other factors</span>
							</div>
							<div className="flex items-center">
								<div className="w-4 h-1 bg-red-900 mr-2"></div>
								<span>Cumulative percentage</span>
							</div>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

// Add the new client component with filters
export function BribeByRegionChartWithFilters() {
	const [filters, setFilters] = useState<LocationFilterValues>({});

	const handleFilterChange = useCallback(
		(newFilters: LocationFilterValues) => {
			console.log("Filter changed in Bribe chart:", newFilters);
			setFilters(newFilters);
		},
		[]
	);

	return (
		<div className="flex flex-col gap-4">
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

			<BribeByRegionChart filters={filters} />
		</div>
	);
}

// Add the DissatisfactionParetoChartWithFilters component
export function DissatisfactionParetoChartWithFilters() {
	const [filters, setFilters] = useState<LocationFilterValues>({});

	const handleFilterChange = useCallback(
		(newFilters: LocationFilterValues) => {
			console.log(
				"Filter changed in Dissatisfaction chart:",
				newFilters
			);
			setFilters(newFilters);
		},
		[]
	);

	return (
		<div className="flex flex-col gap-4">
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

			<DissatisfactionParetoChart filters={filters} />
		</div>
	);
}

// Export components
export { DissatisfactionParetoChartWithFilters as ContactsTable };
