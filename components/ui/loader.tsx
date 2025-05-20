"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface LoaderProps {
	size?: "sm" | "md" | "lg";
	className?: string;
	text?: string;
	showText?: boolean;
}

export function Loader({
	size = "md",
	className = "",
	text = "Loading",
	showText = true,
}: LoaderProps) {
	const sizeClasses = {
		sm: "h-4 w-4 border-2",
		md: "h-8 w-8 border-3",
		lg: "h-12 w-12 border-4",
	};

	return (
		<div
			className={cn(
				"flex flex-col items-center justify-center gap-3",
				className
			)}
		>
			<div className="relative">
				<div
					className={cn(
						"animate-spin rounded-full border-t-transparent border-primary",
						sizeClasses[size]
					)}
				/>
				<div
					className={cn(
						"absolute top-0 left-0 animate-ping opacity-75 rounded-full border-t-transparent border-primary",
						sizeClasses[size]
					)}
				/>
			</div>
			{showText && (
				<p className="text-sm font-medium text-muted-foreground animate-pulse">
					{text}
				</p>
			)}
		</div>
	);
}

export function FullPageLoader({ text = "Loading" }: { text?: string }) {
	return (
		<div className="flex h-screen w-full items-center justify-center">
			<div className="flex flex-col items-center gap-4">
				<Loader
					size="lg"
					text={text}
				/>
			</div>
		</div>
	);
}
