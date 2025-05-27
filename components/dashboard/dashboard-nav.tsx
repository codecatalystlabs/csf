"use client";

import type React from "react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	Home,
	Users,
	Briefcase,
	Phone,
	BarChart3,
	Settings,
	HelpCircle,
	ChevronRight,
	Banknote,
	Building2,
	TrendingUp,
	ThumbsDown,
	Database,
	MessageSquare,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSidebar } from "@/components/dashboard/sidebar-provider";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMediaQuery } from "@/hooks/use-media-query";

interface NavItem {
	title: string;
	href: string;
	icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
	{
		title: "Home",
		href: "/dashboard",
		icon: Home,
	},
	// {
	// 	title: "Bribe",
	// 	href: "/dashboard/bribe",
	// 	icon: Banknote,
	// },
	{
		title: "Level/Service Delivery Units",
		href: "/dashboard/level",
		icon: Building2,
	},
	{
		title: "Satisfaction Trends",
		href: "/dashboard/accounts",
		icon: TrendingUp,
	},
	{
		title: "Client Disatisfaction",
		href: "/dashboard/client-disatisfaction",
		icon: ThumbsDown,
	},
	{
		title: "Client Comments",
		href: "/dashboard/client-comments",
		icon: MessageSquare,
	},
	{
		title: "All Data",
		href: "/dashboard/all-data",
		icon: Database,
	},
	// {
	//   title: "Reports",
	//   href: "/dashboard/reports",
	//   icon: BarChart3,
	// },
	// {
	//   title: "Settings",
	//   href: "/dashboard/settings",
	//   icon: Settings,
	// },
	// {
	//   title: "Help",
	//   href: "/dashboard/help",
	//   icon: HelpCircle,
	// },
];

export function DashboardNav() {
	const pathname = usePathname();
	const { isOpen, isCollapsed, close } = useSidebar();
	const isMobile = useMediaQuery("(max-width: 768px)");

	// Update the close function to check if we're in the settings page
	const isSettingsPage = pathname.includes("/dashboard/settings");

	// Handle navigation click - only close sidebar on mobile
	const handleNavClick = () => {
		if (isMobile) {
			close();
		}
	};

	return (
		<>
			{/* Overlay for mobile - don't close automatically in settings page */}
			{isOpen && (
				<div
					className="fixed inset-0 z-20 bg-background/80 backdrop-blur-sm md:hidden"
					onClick={(e) => {
						// Prevent closing if we're in settings page and clicking on a form element
						if (
							isSettingsPage &&
							(e.target as HTMLElement).closest(
								'form, button, [role="tablist"]'
							)
						) {
							e.stopPropagation();
							return;
						}
						close();
					}}
				/>
			)}

			<aside
				className={cn(
					"fixed inset-y-0 left-0 z-20 flex flex-col border-r bg-background/50 backdrop-blur-sm transition-all duration-300 md:sticky ",
					isOpen ? "translate-x-0" : "-translate-x-full",
					isCollapsed ? "md:w-[70px]" : "w-64"
				)}
			>
				<ScrollArea className="flex-1 py-2 scrollbar-thin scrollbar-track-background scrollbar-thumb-muted hover:scrollbar-thumb-muted-foreground">
					<nav
						className={cn(
							"grid gap-2",
							isCollapsed ? "px-2" : "px-3"
						)}
					>
						<TooltipProvider delayDuration={0}>
							{navItems.map((item) => {
								const NavItem = (
									<Button
										key={item.href}
										variant={
											pathname === item.href
												? "secondary"
												: "ghost"
										}
										className={cn(
											"group relative flex h-12 items-center justify-start gap-3 rounded-xl px-4 text-sm font-medium transition-all duration-200",
											pathname === item.href
												? "bg-yellow-50/50 text-yellow-800 shadow-sm"
												: "text-muted-foreground hover:bg-yellow-50/30 hover:text-yellow-800",
											isCollapsed &&
												"justify-center px-0",
											"hover:scale-[1.01] active:scale-[0.99] motion-safe:transform motion-safe:transition"
										)}
										asChild
									>
										<Link
											href={item.href}
											onClick={handleNavClick}
										>
											<item.icon
												className={cn(
													"h-5 w-5 transition-colors",
													pathname ===
														item.href
														? "text-yellow-600/80"
														: "text-muted-foreground/70 group-hover:text-yellow-600/70"
												)}
											/>
											{!isCollapsed && (
												<>
													<span
														className={cn(
															"transition-colors duration-200",
															pathname ===
																item.href
																? "font-medium text-yellow-800"
																: "group-hover:text-yellow-800"
														)}
													>
														{
															item.title
														}
													</span>
													{pathname ===
														item.href && (
														<div className="absolute right-3 opacity-50">
															<ChevronRight className="h-4 w-4 text-yellow-600/70" />
														</div>
													)}
												</>
											)}
											{pathname ===
												item.href && (
												<>
													<div className="absolute left-0 top-1/2 h-8 w-0.5 -translate-y-1/2 rounded-r-full bg-yellow-400/50" />
													<div className="absolute inset-0 rounded-xl bg-gradient-to-r from-yellow-100/20 to-transparent opacity-30" />
												</>
											)}
										</Link>
									</Button>
								);

								return isCollapsed ? (
									<Tooltip key={item.href}>
										<TooltipTrigger asChild>
											{NavItem}
										</TooltipTrigger>
										<TooltipContent
											side="right"
											className="bg-background/80 backdrop-blur-sm"
										>
											{item.title}
										</TooltipContent>
									</Tooltip>
								) : (
									NavItem
								);
							})}
						</TooltipProvider>
					</nav>
				</ScrollArea>
			</aside>
		</>
	);
}
