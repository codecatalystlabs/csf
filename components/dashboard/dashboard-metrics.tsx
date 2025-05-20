"use client";

import { useState, useRef } from "react";
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
import { SatisfactionTrendChart } from "./satisfaction-trend-chart";
import { SatisfactionGaugeChart } from "./satisfaction-gauge-chart";
import { SatisfactionPieChart } from "./satisfaction-pie-chart";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/app/context/auth-context";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

type TimePeriod = "today" | "this_month" | "last_month" | "cumulative";

interface DashboardMetricsProps {
	filters?: LocationFilterValues;
}

export function DashboardMetrics({ filters }: DashboardMetricsProps) {
	const { toast } = useToast();
	const { user } = useAuth();
	const [timePeriod, setTimePeriod] = useState<TimePeriod>("this_month");
	const [isGeneratingReport, setIsGeneratingReport] = useState(false);
	const dashboardRef = useRef<HTMLDivElement>(null);

	// Build the dashboard data endpoint with filter parameters including user role
	const dashboardEndpoint = DASHBOARD_ENDPOINTS.getFilteredDashboardData({
		region: filters?.region || user?.region,
		district: filters?.district,
		facility: filters?.facility,
		period: timePeriod,
		role: user?.region ? "region" : "national",
	});

	// Fetch dashboard data with filters
	const {
		data,
		error,
		isLoading,
		mutate: refreshDashboard,
	} = useSWR(dashboardEndpoint, authFetcher);

	// Handle period change
	const handlePeriodChange = (period: TimePeriod) => {
		setTimePeriod(period);
	};

	// Get data for the selected time period
	const periodData = data?.[timePeriod] || {};

	// Function to determine satisfaction color based on the value
	const getSatisfactionColor = (value: number): string => {
		if (value >= 80) return "bg-green-500";
		if (value > 50) return "bg-yellow-500";
		return "bg-red-500";
	};

	const satisfactionPercentage = periodData.overall_satisfaction ?? 0;
	const satisfactionColor = getSatisfactionColor(satisfactionPercentage);

	// Generate PDF report with dashboard visuals
	const generateReport = async () => {
		setIsGeneratingReport(true);

		try {
			toast({
				title: "Generating Report",
				description: "Capturing dashboard data. Please wait...",
				duration: 3000,
			});

			if (!dashboardRef.current) {
				throw new Error("Dashboard reference not found");
			}

			// Get current date for report filename and title
			const reportDate = new Date().toLocaleDateString();
			const reportTimestamp = new Date().toISOString().split("T")[0];

			// Create report title with filters
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

			// Use html2canvas to capture the dashboard as an image
			const canvas = await html2canvas(dashboardRef.current, {
				scale: 2, // Higher scale for better quality
				useCORS: true, // Allow cross-origin images
				logging: false,
				backgroundColor: "#ffffff",
			});

			// Create PDF with appropriate page size
			const imgWidth = 210; // A4 width in mm
			const imgHeight = (canvas.height * imgWidth) / canvas.width;

			const pdf = new jsPDF({
				orientation: imgHeight > 297 ? "portrait" : "portrait",
				unit: "mm",
				format: "a4",
			});

			// Add title and filters to PDF
			pdf.setFontSize(18);
			pdf.text(reportTitle, 10, 10);

			if (filterText) {
				pdf.setFontSize(12);
				pdf.text(`Filters: ${filterText}`, 10, 20);
			}

			// Add the canvas image to PDF
			const imgData = canvas.toDataURL("image/png");
			pdf.addImage(
				imgData,
				"PNG",
				10,
				30,
				imgWidth - 20,
				imgHeight * 0.9
			);

			// Save the PDF
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

			// Fallback for development/demo - try server API
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

				// Fetch the report as a blob
				const response = await fetch(reportEndpoint, {
					method: "GET",
					headers: {
						Accept: "application/pdf",
						// Add auth header if needed
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

				// Get the blob from the response
				const blob = await response.blob();

				// Create a URL for the blob
				const url = window.URL.createObjectURL(blob);

				// Create a temporary anchor element and trigger download
				const a = document.createElement("a");
				a.href = url;
				a.download = `dashboard-report-${timePeriod}-${
					new Date().toISOString().split("T")[0]
				}.pdf`;
				document.body.appendChild(a);
				a.click();

				// Clean up
				window.URL.revokeObjectURL(url);
				document.body.removeChild(a);

				toast({
					title: "Server Report Generated",
					description:
						"Your report has been downloaded from the server.",
					duration: 3000,
				});
			} catch (serverError) {
				console.error(
					"Error generating server report:",
					serverError
				);

				// Ultimate fallback - JSON data
				toast({
					title: "Generating Basic Report",
					description:
						"Generating a simplified JSON report with dashboard data.",
					duration: 3000,
				});

				setTimeout(() => {
					// Create a simple text blob with dashboard data as fallback
					const reportData = JSON.stringify(periodData, null, 2);
					const blob = new Blob([reportData], {
						type: "application/json",
					});
					const url = window.URL.createObjectURL(blob);

					// Create a temporary anchor element and trigger download
					const a = document.createElement("a");
					a.href = url;
					a.download = `dashboard-report-${timePeriod}-${
						new Date().toISOString().split("T")[0]
					}.json`;
					document.body.appendChild(a);
					a.click();

					// Clean up
					window.URL.revokeObjectURL(url);
					document.body.removeChild(a);

					toast({
						title: "Basic Report Generated",
						description:
							"A simplified JSON report has been downloaded.",
						duration: 3000,
					});
				}, 1500);
			}
		} finally {
			setIsGeneratingReport(false);
		}
	};

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap gap-2">
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
						timePeriod === "cumulative"
							? "default"
							: "outline"
					}
					onClick={() => handlePeriodChange("cumulative")}
					size="sm"
				>
					Cumulative
				</Button>
				<div className="ml-auto flex gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => refreshDashboard()}
					>
						Refresh
					</Button>
					<Button
						variant="default"
						size="sm"
						onClick={generateReport}
						disabled={isGeneratingReport || isLoading}
						className="gap-2"
					>
						{isGeneratingReport ? (
							<>
								<div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-opacity-50 border-t-transparent"></div>
								Generating...
							</>
						) : (
							<>
								<FileText className="h-4 w-4" />
								Generate Report
							</>
						)}
					</Button>
				</div>
			</div>

			{error ? (
				<Card className="p-4 text-red-500">
					Error loading dashboard data:{" "}
					{error.message || "Unknown error"}
				</Card>
			) : (
				<div ref={dashboardRef}>
					{/* Overall Satisfaction Progress Bar */}
					<Card className="mb-4">
						<CardHeader className="pb-2">
							<CardTitle className="text-lg font-medium">
								Overall Client Satisfaction
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-2">
								<div className="flex justify-between text-sm">
									<span>Satisfaction Rate</span>
									<span className="font-medium">
										{satisfactionPercentage}%
									</span>
								</div>
								<div className="h-4 rounded-full bg-secondary overflow-hidden">
									<div
										className={`h-full rounded-full ${satisfactionColor}`}
										style={{
											width: `${satisfactionPercentage}%`,
										}}
									></div>
								</div>
								<div className="flex justify-between text-xs text-muted-foreground">
									<span>0%</span>
									<span>50%</span>
									<span>100%</span>
								</div>
							</div>
						</CardContent>
					</Card>

					<div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
						<MetricsCard
							title="Total Entries"
							value={periodData.total_clients ?? 0}
							icon={FileBarChart}
							isLoading={isLoading}
						/>
						<MetricsCard
							title="Total Clients"
							value={periodData.total_clients ?? 0}
							icon={Users}
							isLoading={isLoading}
						/>
						<MetricsCard
							title="Satisfied Clients"
							value={periodData.satisfied_clients ?? 0}
							icon={Smile}
							description={`${satisfactionPercentage}% satisfaction rate`}
							isLoading={isLoading}
						/>
						<MetricsCard
							title="Male Entries"
							value={periodData.male_entries ?? 0}
							icon={UserCircle}
							isLoading={isLoading}
						/>
						<MetricsCard
							title="Female Entries"
							value={periodData.female_entries ?? 0}
							icon={UserRound}
							isLoading={isLoading}
						/>
						<MetricsCard
							title="Facilities Asking Bribes"
							value={
								periodData.facilities_asking_bribes ?? 0
							}
							icon={AlertTriangle}
							trend={
								periodData.facilities_asking_bribes > 0
									? "up"
									: "neutral"
							}
							trendValue={
								periodData.facilities_asking_bribes > 0
									? "Requires attention"
									: "No issues reported"
							}
							isLoading={isLoading}
						/>
						<MetricsCard
							title="Timely Encounters"
							value={periodData.timely_encounters ?? 0}
							icon={Clock}
							isLoading={isLoading}
						/>
					</div>

					{/* Satisfaction Visualizations */}
					<div className="grid grid-cols-1 gap-4">
						{/* Gauge and Pie Charts side-by-side */}
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<SatisfactionGaugeChart filters={filters} />
							<SatisfactionPieChart filters={filters} />
						</div>
						{/* Trend Chart - full width */}
						<SatisfactionTrendChart filters={filters} />
					</div>
				</div>
			)}
		</div>
	);
}
