"use client";

import React, { useState, useCallback, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	FilterBar,
	ExtendedLocationFilterValues,
} from "@/components/dashboard/filter-bar";
import { LocationFilterValues } from "@/components/filters/location-filter";
import { useAuth } from "@/app/context/auth-context";
import { DashboardMetrics, DashboardMetricsRef } from "./dashboard-metrics";
import { IndicatorsProgress } from "./indicators-progress";
import { ServicePointProgress } from "./service-point-progress";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

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

export function DashboardOverview() {
	const { user } = useAuth();
	const [filters, setFilters] = useState<ExtendedLocationFilterValues>({});
	const [isGeneratingReport, setIsGeneratingReport] = useState(false);
	const dashboardMetricsRef = useRef<DashboardMetricsRef>(null);

	const handleFilterChange = useCallback(
		(newFilters: ExtendedLocationFilterValues) => {
			setFilters(newFilters);
		},
		[]
	);

	const handleRefresh = useCallback(() => {
		if (dashboardMetricsRef.current) {
			dashboardMetricsRef.current.refreshDashboard();
		}
	}, []);

	const handleGenerateReport = useCallback(() => {
		if (dashboardMetricsRef.current) {
			dashboardMetricsRef.current.generateReport();
		}
	}, []);

	const extendedFilters = {
		...filters,
		timePeriod: filters.timePeriod || "cumulative",
		selectedYear: filters.selectedYear,
		selectedMonth: filters.selectedMonth,
		selectedQuarter: filters.selectedQuarter,
		selectedDate: filters.selectedDate,
	};

	return (
		<div className="flex flex-col gap-4">
			{/* <UgandanFlagRibbon /> */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div className="flex items-center gap-2">
					<h1 className="text-2xl font-bold">Home</h1>
				</div>
				{user && (
					<div className="text-sm text-gray-600">
						Logged in as: {user.username}
						{user.role && ` (${user.role})`}
						{user.region && ` - ${user.region}`}
					</div>
				)}
			</div>

			<FilterBar
				restrictToUserRegion={true}
				onFilterChange={handleFilterChange}
				onRefresh={handleRefresh}
				onGenerateReport={handleGenerateReport}
				isGeneratingReport={isGeneratingReport}
			/>

			{/* Dashboard metrics */}
			<DashboardMetrics
				ref={dashboardMetricsRef}
				filters={filters}
				onGeneratingReportChange={setIsGeneratingReport}
			/>

			{/* Indicators and Service Point Progress side by side */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<IndicatorsProgress filters={extendedFilters} />
				<ServicePointProgress filters={extendedFilters} />
			</div>
		</div>
	);
}
