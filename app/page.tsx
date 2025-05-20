"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { FullPageLoader } from "@/components/ui/loader";

export default function Home() {
	const router = useRouter();
	const [isRedirecting, setIsRedirecting] = useState(true);

	useEffect(() => {
		const checkAuthAndRedirect = () => {
			if (typeof window === "undefined") return;

			try {
				// Check if user is authenticated
				const isAuthenticated =
					localStorage.getItem("isAuthenticated") === "true";

				// Get stored user data to verify it's not corrupt
				const storedUser = localStorage.getItem("user");
				const validUserData = storedUser
					? JSON.parse(storedUser)
					: null;

				// Only consider authenticated if both flags and user data are valid
				const isFullyAuthenticated =
					isAuthenticated && validUserData;

				// Redirect to dashboard if authenticated, otherwise to login
				if (isFullyAuthenticated) {
					router.push("/dashboard");
				} else {
					// Clean up potentially inconsistent state
					if (isAuthenticated && !validUserData) {
						localStorage.removeItem("isAuthenticated");
						localStorage.removeItem("user");
					}
					router.push("/auth/login");
				}
			} catch (error) {
				console.error("Error checking auth state:", error);
				// If there's an error reading from localStorage, clear it and go to login
				localStorage.removeItem("user");
				localStorage.removeItem("isAuthenticated");
				router.push("/auth/login");
			}
		};

		// Check auth status and redirect
		checkAuthAndRedirect();

		// Return cleanup function
		return () => {
			setIsRedirecting(false);
		};
	}, [router]);

	// Show loading state while checking authentication
	return <FullPageLoader text="Checking authentication..." />;
}
