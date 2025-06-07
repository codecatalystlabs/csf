"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface MetricsCardProps {
	title: string;
	value: string | number;
	icon: LucideIcon;
	description?: string;
	trend?: "up" | "down" | "neutral";
	trendValue?: string;
	isLoading?: boolean;
	className?: string;
}

export function MetricsCard({
	title,
	value,
	icon: Icon,
	description,
	trend,
	trendValue,
	isLoading = false,
	className = "",
}: MetricsCardProps) {
	const trendColor =
		trend === "up"
			? "text-green-500"
			: trend === "down"
			? "text-red-500"
			: "text-gray-500";

	return (
		<Card className={className}>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
				<CardTitle className="text-sm font-medium">
					{title}
				</CardTitle>
				<Icon className="h-4 w-4 text-muted-foreground" />
			</CardHeader>
			<CardContent>
				{isLoading ? (
					<div className="flex items-center space-x-2">
						<div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
						<span className="text-sm text-muted-foreground">
							Loading...
						</span>
					</div>
				) : (
					<>
						<div className="text-2xl font-bold">{value}</div>
						{description && (
							<p className="text-xs text-muted-foreground mt-1">
								{description}
							</p>
						)}
						{trend && trendValue && (
							<div
								className={`text-xs ${trendColor} flex items-center mt-1`}
							>
								{trend === "up" && (
									<span className="mr-1">↑</span>
								)}
								{trend === "down" && (
									<span className="mr-1">↓</span>
								)}
								{trendValue}
							</div>
						)}
					</>
				)}
			</CardContent>
		</Card>
	);
}


// PUT

// {
// 	name: "Total",
// 	value: 100,
// 	icon: UserIcon,
// 	description: "Total number of users",
// 	trend: "up",
// 	trendValue: "10%",
// 	isLoading: false,
// 	className: "w-full",
// }