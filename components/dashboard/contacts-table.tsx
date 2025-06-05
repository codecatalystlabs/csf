"use client";

import React, { useState, useMemo, useCallback } from "react";
import useSWR from "swr";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Loader } from "@/components/ui/loader";
import { BASE_URL } from "@/lib/api-config";
import { ThumbsDown, AlertTriangle } from "lucide-react";
import { useAuth } from "@/app/context/auth-context";
import { LocationFilterValues } from "@/components/filters/location-filter";
import { ExtendedLocationFilterValues } from "@/components/dashboard/filter-bar";
import { FilterBar } from "@/components/dashboard/filter-bar";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
	ReferenceLine,
	ComposedChart,
} from "recharts";
import Image from "next/image";
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
import { Button } from "@/components/ui/button";

// Fetcher function for the SWR hook
const fetcher = (url: string) => fetch(url).then((res) => res.json());

// Define the type for dissatisfaction factor data
interface DissatisfactionFactor {
	factor: string;
	count: number;
	percentage: number;
	cumulative_percentage: number;
}

// Define the type for the elements in chartData
interface ChartDataItem extends DissatisfactionFactor {
	isTopFactor: boolean;
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
	filters?: ExtendedLocationFilterValues;
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

		// Add time period filters from ExtendedLocationFilterValues
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
	filters?: ExtendedLocationFilterValues;
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

		// Add time period filters from ExtendedLocationFilterValues
		const timePeriod = filters?.timePeriod || "cumulative";
		const selectedYear = filters?.selectedYear;
		const selectedMonth = filters?.selectedMonth;
		const selectedQuarter = filters?.selectedQuarter;
		const selectedDate = filters?.selectedDate;

		// Map time periods to API timeframe parameter
		if (timePeriod === "today") {
			params.append("timeframe", "today");
		} else if (timePeriod === "cumulative") {
			params.append("timeframe", "cumulative");
		} else if (timePeriod === "by_year") {
			params.append("timeframe", "this_year");
			if (selectedYear) params.append("year", String(selectedYear));
		} else if (timePeriod === "by_month_year") {
			params.append("timeframe", "this_month");
			if (selectedYear) params.append("year", String(selectedYear));
			if (selectedMonth) params.append("month", selectedMonth);
		} else if (timePeriod === "by_quarter_year") {
			params.append("timeframe", "current_quarter");
			if (selectedYear) params.append("year", String(selectedYear));
			if (selectedQuarter)
				params.append("quarter", String(selectedQuarter));
		} else if (timePeriod === "by_month") {
			params.append("timeframe", "this_month");
		} else if (timePeriod === "by_date") {
			params.append("timeframe", "today");
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
			// Default to this_month if no other time period is selected
			params.append("timeframe", "this_month");
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
			"DissatisfactionPareto Endpoint:",
			fullEndpoint,
			"Filters:",
			filters
		);

		return fullEndpoint;
	}, [filters, user?.region]);

	const { data: apiResponse, error, isLoading } = useSWR(endpoint, fetcher);

	// Extract timePeriod for data access
	const timePeriod = filters?.timePeriod || "cumulative";

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
	if (!apiResponse) return null;

	// Get data for the selected timeframe - map timePeriod to API response keys
	let apiTimeframe = "this_month"; // default
	if (timePeriod === "today") apiTimeframe = "today";
	else if (timePeriod === "cumulative") apiTimeframe = "cumulative";
	else if (timePeriod === "by_year") apiTimeframe = "this_year";
	else if (timePeriod === "by_month_year") apiTimeframe = "this_month";
	else if (timePeriod === "by_quarter_year")
		apiTimeframe = "current_quarter";
	else if (timePeriod === "by_month") apiTimeframe = "this_month";
	else if (timePeriod === "by_date") apiTimeframe = "today";

	const data = apiResponse.data[apiTimeframe] || [];
	const total = apiResponse.totals[apiTimeframe] || 0;

	// Check if we have data for this timeframe
	if (data.length === 0) {
		return (
			<div className="space-y-4">
				<Card>
					<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
						<CardTitle className="text-lg font-medium">
							Factors contributing to client
							dissatisfaction
						</CardTitle>
						<ThumbsDown className="h-5 w-5 text-red-500" />
					</CardHeader>
					<CardContent>
						<div className="h-[400px] flex items-center justify-center text-muted-foreground">
							No dissatisfaction data available for this
							time period
						</div>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Find the threshold for 80% cumulative
	const thresholdIndex = data.findIndex(
		(item: DissatisfactionFactor) => item.cumulative_percentage > 80
	);

	// Transform data for recharts - include both count and cumulative data
	const chartData: ChartDataItem[] = data.map(
		(item: DissatisfactionFactor, index: number) => ({
			factor: item.factor,
			count: item.count,
			percentage: item.percentage,
			cumulative_percentage: item.cumulative_percentage,
			isTopFactor: index <= thresholdIndex,
		})
	);

	// Custom label for percentage with background
	const renderCustomBarLabel = (props: any) => {
		const { x, y, width, value, payload } = props; // height is not reliable here for individual segments.

		// Add a check for payload
		if (
			!payload ||
			value === undefined ||
			value === null ||
			!payload.isTopFactor
		) {
			return null;
		}

		// Use a fixed height or calculate based on bar's total height if needed
		// For simplicity, let's assume a consistent visual placement.

		const labelText =
			typeof value === "number"
				? `${Math.round(value)}%`
				: `${value}%`;

		// Positioning logic for the label
		const textX = x + width / 2;
		// Position towards the bottom of where the bar segment would be.
		// This might need adjustment depending on how Recharts provides y for stacked/grouped charts.
		// For a simple bar, y is the top of the bar.
		// Let's try to place it ~70-80% down from the top of the bar, assuming y is the bar top.
		// The `height` prop on `renderCustomBarLabel` refers to the entire Y-axis space, not the bar height.
		// We need to be careful with positioning. Let's use a fixed offset from the bar top for now.
		const labelYOffset = 30; // pixels from the top of the bar, adjust as needed
		let textY = y + labelYOffset;

		// A more robust way to get bar height if not directly available:
		// It would involve knowing the y-axis scale and the data value.
		// For now, we'll rely on relative positioning or fixed offsets.
		// The image shows labels quite low on the bars.
		// Let's try to guess based on bar height. If barSize is 60, maybe y + 40?

		// A simpler approach if `height` refers to the bar segment height (often it does for <Cell> context):
		// const textY = y + height * 0.75; // This is ideal if height is segment height

		// Given the context, `y` is the top of the bar, `height` could be the axis height.
		// The percentage labels in the image are placed relatively low.
		// Let's try to calculate based on bar's actual visual height which is related to `barSize` (60)
		// The actual rendered bar height corresponds to its value on the Y-axis.
		// We'll position it from the *top* of the bar.

		const barTopY = y;
		const valueAlongYAxis = payload.count; // The value that determines bar height
		// This is complex to calculate exactly without y-axis scale.
		// For now, let's use a simpler fixed offset from top of bar, or relative to bar width as a proxy for size
		textY = barTopY + 40; // Try a fixed offset and adjust
		if (width < 40) {
			// For very narrow bars, move label up
			textY = barTopY + 20;
		}

		// Estimate text width for background rect
		const estTextWidth = labelText.length * 7; // approx 7px per char
		const rectWidth = estTextWidth + 10;
		const rectHeight = 20;

		return (
			<g>
				<rect
					x={textX - rectWidth / 2}
					y={textY - rectHeight / 2}
					width={rectWidth}
					height={rectHeight}
					fill="rgba(255, 255, 255, 0.9)"
					rx="3"
					ry="3"
				/>
				<text
					x={textX}
					y={textY}
					fill="#000000"
					textAnchor="middle"
					dominantBaseline="middle"
					fontSize="11"
					fontWeight="bold"
				>
					{labelText}
				</text>
			</g>
		);
	};

	return (
		<div className="space-y-4">
			<Card>
				<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle className="text-xl font-medium text-center w-full">
						Client Dissatisfaction Pareto Analysis
						<div className="text-sm font-normal text-gray-600 mt-1">
							Factors Contributing to 80% of Client
							Dissatisfaction
						</div>
					</CardTitle>
					<Image
						src="https://res.cloudinary.com/dacjwtf69/image/upload/v1747980762/flag_vykum0.jpg"
						alt="Uganda Flag"
						width={30}
						height={20}
					/>
				</CardHeader>
				<CardContent>
					<div className="h-[500px] mt-4">
						<ResponsiveContainer
							width="100%"
							height="100%"
						>
							<ComposedChart
								data={chartData}
								margin={{
									top: 30,
									right: 30,
									left: 20,
									bottom: 100,
								}}
								barSize={60}
								barGap={0}
							>
								<CartesianGrid
									strokeDasharray="3 3"
									vertical={true}
									horizontal={true}
									stroke="#e5e7eb"
									strokeWidth={0.5}
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
										if (
											name ===
											"cumulative_percentage"
										) {
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
								{/* Bar chart for factor counts */}
								<Bar
									yAxisId="left"
									dataKey="count"
									name="Number of Cases"
									animationDuration={1000}
								>
									{chartData.map(
										(
											entry: ChartDataItem,
											index: number
										) => (
											<Cell
												key={`cell-${index}`}
												fill={
													entry.isTopFactor
														? "#ef4444" // Brighter red for top factors
														: "#3b82f6" // Blue for others
												}
												stroke={
													entry.isTopFactor
														? "#dc2626" // Darker red border
														: "#2563eb" // Darker blue border
												}
												strokeWidth={1}
											/>
										)
									)}
									<LabelList
										dataKey="count"
										position="top"
										style={{
											fontSize: 11,
											fill: "#374151",
											fontWeight: "600",
										}}
									/>
									{/* Replace old percentage LabelList with custom one */}
									<LabelList
										dataKey="percentage"
										content={renderCustomBarLabel}
									/>
								</Bar>
								{/* Line for cumulative percentage */}
								<Line
									yAxisId="right"
									type="monotone"
									dataKey="cumulative_percentage"
									stroke="#000000"
									strokeWidth={3}
									dot={{
										fill: "#000000",
										r: 5,
										strokeWidth: 2,
										stroke: "#ffffff",
									}}
									activeDot={{
										r: 7,
										stroke: "#000000",
										strokeWidth: 2,
										fill: "#ffffff",
									}}
									name="Cumulative %"
									connectNulls={false}
									label={{
										position: "top",
										fill: "#000000",
										fontSize: 10,
										fontWeight: "600",
										formatter: (value: number) =>
											`${value.toFixed(1)}%`,
									}}
								/>
								{/* Reference lines for important thresholds */}
								{[
									0, 10, 20, 30, 40, 50, 60, 70, 80,
									90, 100,
								].map((value) => (
									<ReferenceLine
										key={`hline-${value}`}
										y={value}
										yAxisId="right"
										stroke={
											value === 80
												? "#dc2626"
												: "#e5e7eb"
										}
										strokeWidth={
											value === 80 ? 2 : 1
										}
										strokeDasharray={
											value === 80
												? "5 5"
												: "3 3"
										}
										label={
											value % 20 === 0
												? {
														value: `${value}%`,
														position:
															"right",
														fill:
															value ===
															80
																? "#dc2626"
																: "#6b7280",
														fontSize: 10,
														fontWeight:
															value ===
															80
																? "600"
																: "normal",
												  }
												: undefined
										}
									/>
								))}
							</ComposedChart>
						</ResponsiveContainer>
					</div>
					<div className="mt-4 pt-4 border-t">
						<div className="space-y-3">
							{/* Main legend */}
							<div className="flex items-center justify-center gap-8 text-sm">
								<div className="flex items-center">
									<div className="w-4 h-4 bg-red-500 rounded-sm mr-2 border border-red-700"></div>
									<span className="font-medium">
										Top Contributors (80% of
										issues)
									</span>
								</div>
								<div className="flex items-center">
									<div className="w-4 h-4 bg-blue-500 rounded-sm mr-2 border border-blue-700"></div>
									<span>Other Factors</span>
								</div>
								<div className="flex items-center">
									<div className="h-[3px] w-8 bg-black mr-2 rounded-full"></div>
									<span className="font-medium">
										Cumulative % (Pareto Line)
									</span>
								</div>
							</div>

							{/* Pareto explanation */}
							<div className="text-center text-xs text-gray-600 bg-gray-50 p-2 rounded-md">
								<strong>
									Pareto Principle (80/20 Rule):
								</strong>{" "}
								The red bars represent the few factors
								that contribute to most dissatisfaction
								issues. Focus on these high-impact areas
								for maximum improvement.
							</div>

							{/* Summary stats */}
							<div className="flex justify-center gap-6 text-sm">
								<div className="text-center">
									<div className="font-semibold text-gray-700">
										Total Cases
									</div>
									<div className="text-lg font-bold text-gray-900">
										{total.toLocaleString()}
									</div>
								</div>
								<div className="text-center">
									<div className="font-semibold text-red-600">
										Top Factors
									</div>
									<div className="text-lg font-bold text-red-700">
										{
											chartData.filter(
												(item) =>
													item.isTopFactor
											).length
										}
									</div>
								</div>
								<div className="text-center">
									<div className="font-semibold text-blue-600">
										Other Factors
									</div>
									<div className="text-lg font-bold text-blue-700">
										{
											chartData.filter(
												(item) =>
													!item.isTopFactor
											).length
										}
									</div>
								</div>
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
	const [filters, setFilters] = useState<ExtendedLocationFilterValues>({});

	const handleFilterChange = useCallback(
		(newFilters: ExtendedLocationFilterValues) => {
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
	const [filters, setFilters] = useState<ExtendedLocationFilterValues>({});
	const [timeframe, setTimeframe] = useState<string>("this_month");
	const [selectedMonth, setSelectedMonth] = useState("");
	const [selectedQuarter, setSelectedQuarter] = useState("");
	const [selectedYear, setSelectedYear] = useState("");
	const [selectedDate, setSelectedDate] = useState<Date | undefined>(
		undefined
	);

	const handleFilterChange = useCallback(
		(newFilters: ExtendedLocationFilterValues) => {
			setFilters(newFilters);
		},
		[]
	);

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
