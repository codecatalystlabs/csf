"use client";

import type React from "react";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import {
	SidebarProvider,
	useSidebar,
} from "@/components/dashboard/sidebar-provider";
import { cn } from "@/lib/utils";

function DashboardLayoutContent({ children }: { children: React.ReactNode }) {
	const { isOpen, isCollapsed } = useSidebar();

	return (
		<div className="flex h-screen flex-col overflow-hidden">
			<DashboardHeader />
			<div className="flex flex-1 overflow-hidden">
				<div
					className={cn(
						"flex-shrink-0 border-r bg-background overflow-y-auto transition-all duration-300 ease-in-out",
						isOpen
							? isCollapsed
								? "w-[70px]"
								: "w-64"
							: "w-0 md:w-[70px]"
					)}
				>
					<DashboardNav />
				</div>
				<main
					className={cn(
						"flex-1 overflow-y-auto transition-all duration-300 ease-in-out",
						isCollapsed ? "p-4 md:p-6" : "p-4 md:p-6"
					)}
				>
					{children}
				</main>
			</div>
		</div>
	);
}

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<SidebarProvider>
			<DashboardLayoutContent>{children}</DashboardLayoutContent>
		</SidebarProvider>
	);
}
