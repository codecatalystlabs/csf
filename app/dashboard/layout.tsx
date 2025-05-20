import type React from "react";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { SidebarProvider } from "@/components/dashboard/sidebar-provider";
import { ProtectedRoute } from "@/components/auth/protected-route";

export default function DashboardLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<ProtectedRoute>
			<SidebarProvider>
				<div className="flex min-h-screen flex-col">
					<DashboardHeader />
					<div className="flex flex-1">
						<DashboardNav />
						<main className="flex-1 overflow-y-auto p-4 md:p-6">
							{children}
						</main>
					</div>
				</div>
			</SidebarProvider>
		</ProtectedRoute>
	);
}
