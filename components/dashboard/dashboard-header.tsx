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
import Image from "next/image";

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
					<Image
						src="https://res.cloudinary.com/dacjwtf69/image/upload/v1747973562/mohlogo_zkpnbl.png"
						alt="Logo"
						width={50}
						height={50}
					/>
					<span className="hidden md:inline-block">Routine Client Satisfaction Feedback</span>
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
				{/* <Image
					src="https://res.cloudinary.com/dacjwtf69/image/upload/v1747980762/flag_vykum0.jpg"
					alt="Uganda Flag"
					width={70}
					height={70}
				/> */}
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
