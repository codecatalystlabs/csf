import type React from "react";
import type { Metadata } from "next/types";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/app/context/auth-context";
import { Toaster } from "@/components/ui/toaster";
import { UgandanFlagRibbon } from "@/components/UgandanFlagRibbon";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "CSF",
	description: "CSF",
	generator: "v0.dev",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			suppressHydrationWarning
		>
			<body className={inter.className}>
				<UgandanFlagRibbon />
				<ThemeProvider
					attribute="class"
					defaultTheme="light"
					enableSystem
					disableTransitionOnChange
				>
					<AuthProvider>{children}</AuthProvider>
					<Toaster />
				</ThemeProvider>
			</body>
		</html>
	);
}

import "./globals.css";
