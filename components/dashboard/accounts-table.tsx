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

const fetcher = (url: string) => fetch(url).then((res) => res.json());

interface SatisfactionComponentProps {
	filters?: LocationFilterValues;
}

function SatisfactionHeatmap({ filters }: SatisfactionComponentProps) {
	const { user } = useAuth();

	// Build the endpoint URL with filters
	const endpoint = useMemo(() => {
		const baseUrl = `${BASE_URL}/trends_table`;
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
			"Satisfaction Heatmap Endpoint:",
			fullEndpoint,
			"Filters:",
			filters
		);

		return fullEndpoint;
	}, [filters, user?.region]);

	const { data, error, isLoading } = useSWR(endpoint, authFetcher);

	if (isLoading) return <div>Loading...</div>;
	if (error) return <div className="text-red-500">Failed to load data</div>;
	if (!data) return null;
	const months: string[] = data.months;
	const regions: string[] = data.data.map((d: any) => d.region);
	// Build a region x month matrix
	const matrix = data.data.map((regionObj: any) =>
		months.map((month: string) => regionObj[month])
	);
	// Color logic
	const getCellColor = (value: number | null | undefined) => {
		if (value === null || value === undefined || value === 0)
			return "bg-white text-black";
		if (value >= 80) return "bg-green-400 text-black";
		if (value >= 50) return "bg-yellow-300 text-black";
		return "bg-red-500 text-white";
	};
	return (
		<div className="overflow-x-auto">
			<table className="min-w-max border-collapse">
				<thead>
					<tr>
						<th className="border px-2 py-1 bg-gray-100 text-xs">
							Region
						</th>
						{months.map((monthName) => (
							<th
								key={monthName}
								className="border px-2 py-1 bg-gray-100 text-xs"
							>
								{monthName}
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{regions.map((region, i) => (
						<tr key={region}>
							<td className="border px-2 py-1 text-xs font-medium bg-gray-50">
								{region.replace(/_/g, " ")}
							</td>
							{matrix[i].map(
								(value: number, j: number) => (
									<td
										key={months[j]}
										className={`border px-2 py-1 text-xs text-center font-semibold ${getCellColor(
											value
										)}`}
										style={{ minWidth: 50 }}
									>
										{value && value > 0
											? `${value}%`
											: ""}
									</td>
								)
							)}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}

function GroupedSatisfactionBarGraph({ filters }: SatisfactionComponentProps) {
	const { user } = useAuth();
	const [tooltipContent, setTooltipContent] = useState<{
		text: string;
		x: number;
		y: number;
	} | null>(null);

	// Build the endpoint URL with filters
	const endpoint = useMemo(() => {
		const baseUrl = `${BASE_URL}/trends_graph`;
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
			"Satisfaction Graph Endpoint:",
			fullEndpoint,
			"Filters:",
			filters
		);

		return fullEndpoint;
	}, [filters, user?.region]);

	const { data, error, isLoading } = useSWR(endpoint, authFetcher);

	if (isLoading) return <div>Loading...</div>;
	if (error) return <div className="text-red-500">Failed to load data</div>;
	if (!data) return null;

	const months = data.months;

	// Define custom region order to match the reference image
	const regionOrder = [
		"Ankole",
		"Kigezi",
		"Karamoja",
		"Lango",
		"Tooro",
		"Bukedi",
		"North_Central",
		"Bugisu",
		"Busoga",
		"South_Central",
		"Bunyoro",
		"Teso",
		"West_Nile",
		"Kampala",
		"Acholi",
	];

	// Filter and sort regions based on custom order
	const sortedRegions = regionOrder.filter((r) =>
		data.data.some((d: any) => d.region === r)
	);

	// Define colors for months (matching your reference image)
	const monthColors = [
		"bg-blue-500", // Jun-24
		"bg-indigo-700", // Jul-24
		"bg-green-500", // Aug-24
		"bg-yellow-600", // Sep-24
		"bg-red-500", // Oct-24
		"bg-pink-500", // Nov-24
		"bg-purple-500", // Dec-24
		"bg-rose-600", // 2025-01
		"bg-teal-500", // 2025-02
		"bg-emerald-500", // 2025-03
		"bg-cyan-500", // 2025-04
	];

	// Format month names for display (e.g., "2024-07" to "Jul-24")
	const formatMonthName = (monthStr: string) => {
		if (!monthStr) return "";
		const [year, month]: [string, string] = monthStr.split("-") as [
			string,
			string
		];
		const monthMap: { [key: string]: string } = {
			"01": "Jan",
			"02": "Feb",
			"03": "Mar",
			"04": "Apr",
			"05": "May",
			"06": "Jun",
			"07": "Jul",
			"08": "Aug",
			"09": "Sep",
			"10": "Oct",
			"11": "Nov",
			"12": "Dec",
		};
		return `${monthMap[month]}-${year.slice(2)}`;
	};

	const shortMonthName = (monthStr: string) => {
		if (!monthStr) return "";
		const [year, month]: [string, string] = monthStr.split("-") as [
			string,
			string
		];
		return `${
			month === "01" ? "20" + year.slice(2) + month : month
		}-${year.slice(2)}`;
	};

	const handleMouseOver = (
		event: React.MouseEvent,
		region: string,
		month: string,
		value: number
	) => {
		const rect = event.currentTarget.getBoundingClientRect();
		setTooltipContent({
			text: `${region.replace(/_/g, " ")}: ${Math.round(
				value
			)}% (${formatMonthName(month)})`,
			x: rect.left + window.scrollX,
			y: rect.top + window.scrollY - 30,
		});
	};

	const handleMouseOut = () => {
		setTooltipContent(null);
	};

	return (
		<div className="my-8 border border-gray-200 rounded-md p-4 relative">
			{tooltipContent && (
				<div
					className="absolute z-50 bg-black text-white px-2 py-1 text-xs rounded-md pointer-events-none"
					style={{
						left: tooltipContent.x,
						top: tooltipContent.y,
					}}
				>
					{tooltipContent.text}
				</div>
			)}

			<div className="text-center text-lg font-bold mb-6">
				Trends of client satisfaction by region by month
			</div>

			<div className="overflow-x-auto pb-4">
				<div className="flex">
					{/* Y-axis label - vertical text */}
					<div className="flex items-center -rotate-90 h-64 -ml-10 mt-8 text-sm font-medium text-gray-600">
						% of clients who are satisfied
					</div>

					<div className="flex flex-col">
						{/* Y-axis values and horizontal grid lines */}
						<div className="flex items-stretch">
							<div
								className="flex flex-col justify-between h-96 mr-2 text-xs text-gray-600"
								style={{ width: 40 }}
							>
								<div>100%</div>
								<div>80%</div>
								<div>60%</div>
								<div>40%</div>
								<div>20%</div>
								<div>0%</div>
							</div>

							{/* Legend for months */}
							<div className="flex flex-wrap mb-4 gap-2">
								{months.map(
									(month: string, idx: number) => (
										<div
											key={month}
											className="flex items-center gap-1"
										>
											<div
												className={`h-3 w-3 rounded-full ${
													monthColors[
														idx %
															monthColors.length
													]
												}`}
											></div>
											<span className="text-xs font-medium">
												{shortMonthName(
													month
												)}
											</span>
										</div>
									)
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}

export function SatisfactionTrendsWithFilters() {
	const [filters, setFilters] = useState<LocationFilterValues>({});

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

			<Card>
				<CardHeader>
					<CardTitle>Satisfaction Rate by region</CardTitle>
				</CardHeader>
				<CardContent>
					<SatisfactionHeatmap filters={filters} />
					<GroupedSatisfactionBarGraph filters={filters} />
				</CardContent>
			</Card>
		</div>
	);
}

export function AccountsTable() {
	const [filters, setFilters] = useState<LocationFilterValues>({});

	const handleFilterChange = useCallback(
		(newFilters: LocationFilterValues) => {
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

			<Card>
				<CardHeader>
					<CardTitle>Satisfaction Rate by region</CardTitle>
				</CardHeader>
				<CardContent>
					<SatisfactionHeatmap filters={filters} />
					{/* <GroupedSatisfactionBarGraph filters={filters} /> */}
				</CardContent>
			</Card>
		</div>
	);
}
