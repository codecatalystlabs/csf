"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	Menu,
	Bell,
	Search,
	User,
	PanelLeftClose,
	PanelLeft,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useSidebar } from "@/components/dashboard/sidebar-provider";
import { useAuth } from "@/app/context/auth-context";

export function DashboardHeader() {
	const { toggle, toggleCollapse, isCollapsed } = useSidebar();
	const { user, logout } = useAuth();
	const pathname = usePathname();

	// Get the current page title from the pathname
	const getPageTitle = () => {
		const path = pathname.split("/").pop();
		if (!path || path === "dashboard") return "Dashboard";
		return path.charAt(0).toUpperCase() + path.slice(1);
	};

	return (
		<header className="sticky top-0 z-30 flex h-16 items-center border-b bg-background px-4 md:px-6">
			<div className="flex items-center gap-2 md:hidden">
				<Button
					variant="ghost"
					size="icon"
					onClick={toggle}
				>
					<Menu className="h-5 w-5" />
					<span className="sr-only">Toggle sidebar</span>
				</Button>
			</div>
			<div className="flex items-center gap-2 md:gap-4">
				<Link
					href="/dashboard"
					className="flex items-center gap-2 font-semibold"
				>
					<svg
						xmlns="http://www.w3.org/2000/svg"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
						className="h-6 w-6"
					>
						<path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3" />
					</svg>
					<span className="hidden md:inline-block">
						CSF Admin Dashboard
					</span>
				</Link>
				<span className="text-lg font-semibold md:hidden">
					{getPageTitle()}
				</span>
				<div className="hidden md:block">
					<Button
						variant="ghost"
						size="icon"
						onClick={toggleCollapse}
						title={
							isCollapsed
								? "Expand sidebar"
								: "Collapse sidebar"
						}
					>
						{isCollapsed ? (
							<PanelLeft className="h-5 w-5" />
						) : (
							<PanelLeftClose className="h-5 w-5" />
						)}
					</Button>
				</div>
			</div>
			<div className="ml-auto flex items-center gap-2 md:gap-4">
				<form className="hidden md:block">
					<div className="relative">
						<Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
						<Input
							type="search"
							placeholder="Search..."
							className="w-[200px] pl-8 md:w-[200px] lg:w-[300px]"
						/>
					</div>
				</form>
				<Button
					variant="ghost"
					size="icon"
					className="relative"
				>
					<Bell className="h-5 w-5" />
					<span className="sr-only">Notifications</span>
					<span className="absolute right-1 top-1 flex h-2 w-2 rounded-full bg-primary"></span>
				</Button>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<Button
							variant="ghost"
							size="icon"
							className="rounded-full"
						>
							<User className="h-5 w-5" />
							<span className="sr-only">User menu</span>
						</Button>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="end">
						<DropdownMenuLabel>My Account</DropdownMenuLabel>
						{user && (
							<>
								<DropdownMenuLabel className="font-normal text-xs text-muted-foreground">
									Signed in as {user.username}
								</DropdownMenuLabel>
								<DropdownMenuLabel className="font-normal text-xs text-muted-foreground">
									Role: {user.role}
								</DropdownMenuLabel>
							</>
						)}
						<DropdownMenuSeparator />
						<DropdownMenuItem>
							<Link
								href="/dashboard/settings"
								className="flex w-full"
							>
								Profile
							</Link>
						</DropdownMenuItem>
						<DropdownMenuItem>
							<Link
								href="/dashboard/settings"
								className="flex w-full"
							>
								Settings
							</Link>
						</DropdownMenuItem>
						<DropdownMenuSeparator />
						<DropdownMenuItem onClick={logout}>
							Sign out
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</header>
	);
}
