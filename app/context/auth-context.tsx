"use client";

import {
	createContext,
	useContext,
	useState,
	useEffect,
	ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import {
	getAuthenticatedUser,
	saveAuthData,
	clearAuthData,
	isStorageAvailable,
} from "@/lib/auth-utils";

type User = {
	id: number;
	username: string;
	role: string;
	region: string;
	district: string;
	facility: string;
};

type Session = {
	access_token: string;
	user: User;
};

type AuthContextType = {
	user: User | null;
	isAuthenticated: boolean;
	login: (session: Session) => void;
	logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<User | null>(null);
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [isLoading, setIsLoading] = useState(true);
	const router = useRouter();

	// Check if user is authenticated on initial load
	useEffect(() => {
		// Function to get auth data from localStorage
		const loadAuthState = () => {
			const authenticatedUser = getAuthenticatedUser();

			if (authenticatedUser) {
				setUser(authenticatedUser);
				setIsAuthenticated(true);
			}

			setIsLoading(false);
		};

		// Load auth state
		loadAuthState();

		// Set up a storage event listener to sync across tabs
		const handleStorageChange = (event: StorageEvent) => {
			if (event.key === "session") {
				if (event.newValue) {
					const authenticatedUser = getAuthenticatedUser();
					if (authenticatedUser) {
						setUser(authenticatedUser);
						setIsAuthenticated(true);
					}
				} else {
					setUser(null);
					setIsAuthenticated(false);
				}
			}
		};

		if (isStorageAvailable()) {
			window.addEventListener("storage", handleStorageChange);
			return () =>
				window.removeEventListener("storage", handleStorageChange);
		}

		return undefined;
	}, []);

	const login = (session: Session) => {
		setUser(session.user);
		setIsAuthenticated(true);
		saveAuthData(session);
	};

	const logout = () => {
		setUser(null);
		setIsAuthenticated(false);
		clearAuthData();
		router.push("/auth/login");
	};

	return (
		<AuthContext.Provider
			value={{ user, isAuthenticated, login, logout }}
		>
			{!isLoading && children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}
