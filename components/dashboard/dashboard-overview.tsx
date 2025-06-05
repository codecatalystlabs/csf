"use client";

import React, { useState, useCallback, useRef } from "react";
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
				<IndicatorsProgress filters={filters} />
				<ServicePointProgress filters={filters} />
			</div>
		</div>
	);
}
