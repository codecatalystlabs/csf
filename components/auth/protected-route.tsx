"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/auth-context";
import { FullPageLoader } from "@/components/ui/loader";

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
	const { isAuthenticated } = useAuth();
	const [isCheckingAuth, setIsCheckingAuth] = useState(true);
	const router = useRouter();

	useEffect(() => {
		// Check auth from localStorage directly in case the context hasn't loaded yet
		const checkAuth = () => {
			if (typeof window === "undefined") return;

			try {
				const storedAuth =
					localStorage.getItem("isAuthenticated") === "true";

				if (!storedAuth && !isAuthenticated) {
					router.push("/auth/login");
				}
			} catch (error) {
				console.error("Error checking auth:", error);
			} finally {
				setIsCheckingAuth(false);
			}
		};

		// Small delay to allow the auth context to initialize
		const timer = setTimeout(checkAuth, 100);
		return () => clearTimeout(timer);
	}, [isAuthenticated, router]);

	// Show loading while checking authentication
	if (isCheckingAuth) {
		return <FullPageLoader text="Authenticating..." />;
	}

	// If authentication check is complete but user is not authenticated,
	// still show loader as we're redirecting
	if (!isAuthenticated) {
		return <FullPageLoader text="Redirecting to login..." />;
	}

	return <>{children}</>;
}
