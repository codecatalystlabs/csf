"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
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
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Function to generate a list of years (e.g., from 2020 to current year)
const generateYears = () => {
	const currentYear = new Date().getFullYear();
	const years = [];
	for (let year = 2020; year <= currentYear; year++) {
		years.push(year);
	}
	return years;
};

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
	| "by_month_year"
	| "by_quarter_year"
	| "by_date"
	| "by_year"
	| "by_month"
	| "by_date";

interface DashboardMetricsProps {
	filters?: LocationFilterValues;
	onYearRangeChange?: (startYear?: number, endYear?: number) => void;
	initialStartYear?: number;
	initialEndYear?: number;
}

export function DashboardMetrics({
	filters,
	onYearRangeChange,
	initialStartYear,
	initialEndYear,
}: DashboardMetricsProps) {
	const { toast } = useToast();
	const { user } = useAuth();
	const [timePeriod, setTimePeriod] = useState<TimePeriod>("cumulative");
	const [startYear, setStartYear] = useState<number | undefined>(
		initialStartYear
	);
	const [endYear, setEndYear] = useState<number | undefined>(initialEndYear);
	const [isGeneratingReport, setIsGeneratingReport] = useState(false);
	const dashboardRef = useRef<HTMLDivElement>(null);
	const availableYears = generateYears();
	const [selectedYear, setSelectedYear] = useState<string>("");
	const [selectedMonth, setSelectedMonth] = useState<string>("");
	const [selectedQuarter, setSelectedQuarter] = useState<string>("");
	const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);

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

	const handleStartYearChange = useCallback(
		(value: string) => {
			const year = parseInt(value);
			setStartYear(year);
			if (endYear && year > endYear) {
				setEndYear(year);
			}
			setTimePeriod("custom_year_range");
			if (onYearRangeChange)
				onYearRangeChange(
					year,
					endYear && year > endYear ? year : endYear
				);
		},
		[endYear, onYearRangeChange]
	);

	const handleEndYearChange = useCallback(
		(value: string) => {
			const year = parseInt(value);
			setEndYear(year);
			if (startYear && year < startYear) {
				setStartYear(year);
			}
			setTimePeriod("custom_year_range");
			if (onYearRangeChange)
				onYearRangeChange(
					startYear && year < startYear ? year : startYear,
					year
				);
		},
		[startYear, onYearRangeChange]
	);

	// Update internal year state if initial props change
	useEffect(() => {
		setStartYear(initialStartYear);
	}, [initialStartYear]);

	useEffect(() => {
		setEndYear(initialEndYear);
	}, [initialEndYear]);

	const dashboardEndpoint = useMemo(() => {
		const baseUrl = "https://csf.health.go.ug/api/dashboard_data.php";
		const params = new URLSearchParams();

		if (filters?.region) params.append("region", filters.region);
		if (filters?.district) params.append("district", filters.district);
		if (filters?.facility) params.append("facility", filters.facility);

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
				params.append("date_from", selectedDate.toISOString().split('T')[0]);
				params.append("date_to", selectedDate.toISOString().split('T')[0]);
			}
		} else {
			// Default to cumulative if no other time period is selected
			params.append("time_filter", "cumulative");
		}

		const queryString = params.toString();
		const fullEndpoint = queryString ? `${baseUrl}?${queryString}` : baseUrl;
		console.log('Constructed Endpoint:', fullEndpoint);
		console.log('Selected Values:', { selectedYear, selectedMonth, selectedQuarter, selectedDate });
		console.log('Filters:', filters);
		return fullEndpoint;
	}, [filters, timePeriod, selectedYear, selectedMonth, selectedQuarter, selectedDate]);

	const {
		data,
		error,
		isLoading,
		mutate: refreshDashboard,
	} = useSWR(dashboardEndpoint, authFetcher, {
		revalidateOnFocus: false,
		onSuccess: (data) => {
			console.log('Dashboard Data:', data);
		},
		onError: (error) => {
			console.error('Error fetching dashboard data:', error);
		}
	});

	const handlePeriodChange = (period: TimePeriod) => {
		setTimePeriod(period);
		// If a predefined period is selected, clear custom years from API call
		if (period !== "custom_year_range") {
			// Optionally clear visual selection of years or let them persist for next custom selection
			// setStartYear(undefined)
			// setEndYear(undefined)
			if (onYearRangeChange) onYearRangeChange(undefined, undefined); // Clear in parent if needed
		}
	};

	const periodData =
		data?.[
			timePeriod === "custom_year_range" && (startYear || endYear)
				? "cumulative"
				: timePeriod
		] || {};

	console.log(periodData);

	const getSatisfactionColor = (value: number): string => {
		if (value >= 80) return "bg-green-500";
		if (value > 50) return "bg-yellow-500";
		return "bg-red-500";
	};

	const satisfactionPercentage = periodData.overall_satisfaction ?? 0;
	const satisfactionColor = getSatisfactionColor(satisfactionPercentage);

	const generateReport = async () => {
		setIsGeneratingReport(true);
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
			if (timePeriod === "custom_year_range" && startYear && endYear) {
				reportTitle = `Dashboard Report - ${startYear} to ${endYear} - ${reportDate}`;
			} else if (timePeriod === "custom_year_range" && startYear) {
				reportTitle = `Dashboard Report - From ${startYear} - ${reportDate}`;
			} else if (timePeriod === "custom_year_range" && endYear) {
				reportTitle = `Dashboard Report - Up to ${endYear} - ${reportDate}`;
			}

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
				`dashboard-report-${
					timePeriod === "custom_year_range"
						? `${startYear || "any"}-${endYear || "any"}`
						: timePeriod
				}-${reportTimestamp}.pdf`
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

				if (timePeriod === "custom_year_range") {
					if (startYear)
						params.append("start_year", startYear.toString());
					if (endYear)
						params.append("end_year", endYear.toString());
				} else {
					params.append("period", timePeriod);
				}

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
				a.download = `dashboard-report-${
					timePeriod === "custom_year_range"
						? `${startYear || "any"}-${endYear || "any"}`
						: timePeriod
				}-${reportTimestamp}.pdf`;
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
		}
	};

	return (
		<div className="space-y-4">
			<div className="flex flex-wrap gap-2 items-center">
				{/* Today and Cumulative buttons */}
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

				{/* Month Dropdown (enabled if year is selected) */}
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

				{/* Quarter Dropdown (enabled if year is selected) */}
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
				{/* Year Dropdown */}
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

				{/* Calendar for date selection as a popover */}
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
						<div className="lg:col-span-3 flex flex-col gap-1.5">
							<MetricsCard
								title="Total Clients"
								value={periodData.total_clients ?? 0}
								icon={Users}
								isLoading={isLoading}
								className="h-24 py-1"
							/>
							<MetricsCard
								title="Satisfied Clients"
								value={periodData.satisfied_clients ?? 0}
								icon={Smile}
								description={`${satisfactionPercentage}% satisfaction rate`}
								isLoading={isLoading}
								className="h-24 py-1"
							/>
							<MetricsCard
								title="Male Entries"
								value={periodData.male_entries ?? 0}
								icon={UserCircle}
								isLoading={isLoading}
								className="h-24 py-1"
							/>
							<MetricsCard
								title="Female Entries"
								value={periodData.female_entries ?? 0}
								icon={UserRound}
								isLoading={isLoading}
								className="h-24 py-1"
							/>
							<MetricsCard
								title="Facilities"
								value={periodData.total_facilities ?? 0}
								icon={AlertTriangle}
								trend={
									periodData.total_facilities > 0
										? "up"
										: "neutral"
								}
								trendValue={
									periodData.total_facilities > 0
										? "Requires attention"
										: "No issues reported"
								}
								isLoading={isLoading}
								className="h-24 py-0"
							/>
						</div>
						<div className="lg:col-span-3 flex items-center justify-center">
							<SatisfactionGaugeChart
								filters={{
									...filters,
									timeFilter: timePeriod,
									...(timePeriod === "by_quarter_year" && selectedYear && selectedQuarter
										? { year: Number(selectedYear), quarter: Number(selectedQuarter) }
										: {}),
									...(timePeriod === "by_date" && selectedDate
										? {
											date_from: selectedDate.toISOString().split('T')[0],
											date_to: selectedDate.toISOString().split('T')[0],
										}
										: {}),
								}}
							/>
						</div>
						<div className="lg:col-span-6">
							<SatisfactionTrendChart filters={filters} />
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
