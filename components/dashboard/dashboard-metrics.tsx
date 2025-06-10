"use client";

import {
	useState,
	useRef,
	useCallback,
	useEffect,
	useMemo,
	forwardRef,
	useImperativeHandle,
} from "react";
import useSWR from "swr";
import {
	Users,
	Clock,
	Smile,
	UserCircle,
	UserRound,
	AlertTriangle,
	PieChart,
	Briefcase,
	FileBarChart,
	Download,
	FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { authFetcher } from "@/lib/api-utils";
import { DASHBOARD_ENDPOINTS, BASE_URL } from "@/lib/api-config";
import { MetricsCard } from "./metrics-card";
import { LocationFilterValues } from "@/components/filters/location-filter";
import { ExtendedLocationFilterValues } from "@/components/dashboard/filter-bar";
import { SatisfactionTrendChart } from "./satisfaction-trend-chart";
import { SatisfactionGaugeChart } from "./satisfaction-gauge-chart";
import { SatisfactionPieChart } from "./satisfaction-pie-chart";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/app/context/auth-context";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Loader } from "@/components/ui/loader";
import { Calendar } from "@/components/ui/calendar";
import {
	Popover,
	PopoverTrigger,
	PopoverContent,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DashboardMetricsProps {
	filters?: ExtendedLocationFilterValues;
	onGeneratingReportChange?: (isGenerating: boolean) => void;
}

export interface DashboardMetricsRef {
	refreshDashboard: () => void;
	generateReport: () => void;
}

export const DashboardMetrics = forwardRef<
	DashboardMetricsRef,
	DashboardMetricsProps
>(({ filters, onGeneratingReportChange }, ref) => {
	const { toast } = useToast();
	const { user } = useAuth();
	const [isGeneratingReport, setIsGeneratingReport] = useState(false);
	const dashboardRef = useRef<HTMLDivElement>(null);

	const dashboardEndpoint = useMemo(() => {
		const baseUrl = DASHBOARD_ENDPOINTS.DASHBOARD_VISUALIZATION;
		const params = new URLSearchParams();

		if (filters?.region) params.append("region", filters.region);
		if (filters?.district) params.append("district", filters.district);
		if (filters?.facility) params.append("facility", filters.facility);

		// Add user role parameter
		if (user?.region) {
			params.append("role", "region");
		} else {
			params.append("role", "national");
		}

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

		const queryString = params.toString();
		const fullEndpoint = queryString
			? `${baseUrl}?${queryString}`
			: baseUrl;
		console.log("=== DASHBOARD METRICS DEBUG ===");
		console.log("Constructed Endpoint:", fullEndpoint);
		console.log("Time Period:", timePeriod);
		console.log("Selected Values:", {
			selectedYear,
			selectedMonth,
			selectedQuarter,
			selectedDate,
		});
		console.log("Filters object:", filters);
		console.log("Full URL params:", params.toString());
		console.log("===========================");
		return fullEndpoint;
	}, [filters]);

	const {
		data,
		error,
		isLoading,
		mutate: refreshDashboard,
	} = useSWR(dashboardEndpoint, authFetcher, {
		revalidateOnFocus: false,
		onSuccess: (data) => {
			console.log("Dashboard Data:", data);
		},
		onError: (error) => {
			console.error("Error fetching dashboard data:", error);
		},
	});

	const timePeriod = filters?.timePeriod || "cumulative";
	const selectedYear = filters?.selectedYear;
	const selectedMonth = filters?.selectedMonth;
	const selectedQuarter = filters?.selectedQuarter;
	const selectedDate = filters?.selectedDate;

	const periodData = data || {};

	console.log(periodData);

	const getSatisfactionColor = (value: number): string => {
		if (value >= 80) return "bg-green-500";
		if (value > 50) return "bg-yellow-500";
		return "bg-red-500";
	};

	const satisfactionPercentage = periodData?.overall_satisfaction ?? 0;
	const satisfactionColor = getSatisfactionColor(satisfactionPercentage);

	const generateReport = useCallback(async () => {
		setIsGeneratingReport(true);
		if (onGeneratingReportChange) {
			onGeneratingReportChange(true);
		}
		const reportTimestamp = new Date().toISOString().split("T")[0];
		try {
			toast({
				title: "Generating Report",
				description: "Capturing dashboard data. Please wait...",
				duration: 3000,
			});

			if (!dashboardRef.current) {
				throw new Error("Dashboard reference not found");
			}

			const reportDate = new Date().toLocaleDateString();

			let reportTitle = `Dashboard Report - ${timePeriod.replace(
				"_",
				" "
			)} - ${reportDate}`;

			let filterText = "";

			if (filters?.region)
				filterText += `Region: ${filters.region.replace(
					/_/g,
					" "
				)} `;
			if (filters?.district)
				filterText += `District: ${filters.district.replace(
					/_/g,
					" "
				)} `;
			if (filters?.facility)
				filterText += `Facility: ${filters.facility.replace(
					/_/g,
					" "
				)} `;

			const canvas = await html2canvas(dashboardRef.current, {
				scale: 2,
				useCORS: true,
				logging: false,
				backgroundColor: "#ffffff",
			});

			const imgWidth = 210;
			const imgHeight = (canvas.height * imgWidth) / canvas.width;

			const pdf = new jsPDF({
				orientation: imgHeight > 297 ? "portrait" : "portrait",
				unit: "mm",
				format: "a4",
			});

			pdf.setFontSize(18);
			pdf.text(reportTitle, 10, 10);

			if (filterText) {
				pdf.setFontSize(12);
				pdf.text(`Filters: ${filterText}`, 10, 20);
			}

			const imgData = canvas.toDataURL("image/png");
			pdf.addImage(
				imgData,
				"PNG",
				10,
				30,
				imgWidth - 20,
				imgHeight * 0.9
			);

			pdf.save(
				`dashboard-report-${timePeriod}-${reportTimestamp}.pdf`
			);

			toast({
				title: "Report Generated",
				description:
					"Your PDF report has been generated successfully.",
				duration: 3000,
			});
		} catch (error) {
			console.error("Error generating PDF report:", error);

			toast({
				title: "Report Generation Failed",
				description:
					"Could not generate PDF report. Please try again later.",
				variant: "destructive",
				duration: 5000,
			});

			try {
				const params = new URLSearchParams();
				if (filters?.region)
					params.append("region", filters.region);
				if (filters?.district)
					params.append("district", filters.district);
				if (filters?.facility)
					params.append("facility", filters.facility);
				if (user?.region) params.append("role", "region");
				else params.append("role", "national");

				params.append("period", timePeriod);

				const reportEndpoint = `${BASE_URL}/reports/generate?${params.toString()}`;

				toast({
					title: "Attempting Server Report",
					description:
						"Trying to generate report from server...",
					duration: 3000,
				});

				const response = await fetch(reportEndpoint, {
					method: "GET",
					headers: {
						Accept: "application/pdf",
						Authorization: `Bearer ${localStorage.getItem(
							"auth_token"
						)}`,
					},
				});

				if (!response.ok) {
					throw new Error(
						"Failed to generate report from server"
					);
				}

				const blob = await response.blob();
				const url = window.URL.createObjectURL(blob);
				const a = document.createElement("a");
				a.href = url;
				a.download = `dashboard-report-${timePeriod}-${reportTimestamp}.pdf`;
				document.body.appendChild(a);
				a.click();
				a.remove();
				window.URL.revokeObjectURL(url);

				toast({
					title: "Server Report Downloaded",
					description:
						"PDF report successfully downloaded from the server.",
					duration: 3000,
				});
			} catch (serverError) {
				console.error(
					"Error generating report from server:",
					serverError
				);
				toast({
					title: "Server Report Failed",
					description:
						"Could not generate report from server either.",
					variant: "destructive",
					duration: 5000,
				});
			}
		} finally {
			setIsGeneratingReport(false);
			if (onGeneratingReportChange) {
				onGeneratingReportChange(false);
			}
		}
	}, [filters, timePeriod, toast, user, onGeneratingReportChange]);

	// Expose functions through ref
	useImperativeHandle(
		ref,
		() => ({
			refreshDashboard,
			generateReport,
		}),
		[refreshDashboard, generateReport]
	);

	return (
		<div className="space-y-4">
			{/* Dashboard content */}
			{isLoading && !data ? (
				<div className="h-96 flex items-center justify-center">
					<Loader
						size="lg"
						text="Loading dashboard data..."
					/>
				</div>
			) : error ? (
				<div className="text-red-500">
					Error loading dashboard data. Please try again.
				</div>
			) : (
				<div
					ref={dashboardRef}
					className="p-4 bg-white rounded-md shadow"
				>
					<div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
						{/* Metric cards */}
						<div className="lg:col-span-2 flex flex-col gap-1.5">
							<MetricsCard
								title="Total Clients"
								value={periodData?.total_clients ?? 0}
								icon={Users}
								isLoading={isLoading}
								className="h-24 py-1"
							/>
							<MetricsCard
								title="Satisfied Clients"
								value={periodData?.satisfied_clients ?? 0
								}
								icon={Smile}
								isLoading={isLoading}
								className="h-24 py-1"
							/>
							<MetricsCard
								title="Male Entries"
								value={periodData?.male_entries ?? 0}
								icon={UserCircle}
								isLoading={isLoading}
								className="h-24 py-1"
							/>
							<MetricsCard
								title="Female Entries"
								value={
									periodData?.female_entries ?? 0
								}
								icon={UserRound}
								isLoading={isLoading}
								className="h-24 py-1"
							/>
							<MetricsCard
								title="Facilities"
								value={
									periodData?.total_facilities ?? 0
								}
								icon={AlertTriangle}
								trend={
									(periodData?.total_facilities ?? 0) > 0
										? "up"
										: "neutral"
								}
								trendValue={
									(periodData?.total_facilities ?? 0) > 0
										? ""
										: ""
								}
								isLoading={isLoading}
								className="h-24 py-0"
							/>
						</div>
						<div className="lg:col-span-3 flex items-center justify-center">
							<SatisfactionGaugeChart
								filters={
									{
										region: filters?.region,
										district: filters?.district,
										facility: filters?.facility,
										timeFilter: timePeriod,
										...(timePeriod ===
											"by_quarter_year" &&
										selectedYear &&
										selectedQuarter
											? {
													year: Number(
														selectedYear
													),
													quarter: Number(
														selectedQuarter
													),
											  }
											: {}),
										...(timePeriod ===
											"by_date" && selectedDate
											? {
													date_from:
														selectedDate
															.toISOString()
															.split(
																"T"
															)[0],
													date_to: selectedDate
														.toISOString()
														.split(
															"T"
														)[0],
											  }
											: {}),
									} as LocationFilterValues & {
										timeFilter?: string;
										year?: number;
										quarter?: number;
										date_from?: string;
										date_to?: string;
									}
								}
							/>
						</div>
						<div className="lg:col-span-6">
							<SatisfactionTrendChart
								filters={{
									region: filters?.region,
									district: filters?.district,
									facility: filters?.facility,
									timePeriod: 'last_12_months',
								}}
							/>
						</div>
					</div>
				</div>
			)}
		</div>
	);
});

DashboardMetrics.displayName = "DashboardMetrics";
