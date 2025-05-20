/**
 * Utility functions for authentication and persistence
 */

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
}

/**
 * Checks if localStorage is available in the current environment
 */
export function isStorageAvailable(): boolean {
    if (typeof window === 'undefined') return false;

    try {
        const storage = window.localStorage;
        const testKey = '__storage_test__';
        storage.setItem(testKey, testKey);
        storage.removeItem(testKey);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Gets the authenticated user from storage
 */
export function getAuthenticatedUser(): User | null {
    if (!isStorageAvailable()) return null;

    try {
        const storedSession = localStorage.getItem('session');
        if (storedSession) {
            const session = JSON.parse(storedSession) as Session;
            return session.user;
        }
    } catch (e) {
        // Clear potentially corrupted data
        clearAuthData();
    }

    return null;
}

/**
 * Gets the current session if it exists
 */
export function getSession(): Session | null {
    if (!isStorageAvailable()) return null;

    try {
        const sessionStr = localStorage.getItem('session');
        if (!sessionStr) return null;

        return JSON.parse(sessionStr) as Session;
    } catch (e) {
        // Clear corrupted session data
        localStorage.removeItem('session');
        return null;
    }
}

/**
 * Checks if the user is authenticated
 */
export function isAuthenticated(): boolean {
    return getAuthenticatedUser() !== null;
}

/**
 * Clears all authentication data from storage
 */
export function clearAuthData(): void {
    if (!isStorageAvailable()) return;

    try {
        localStorage.removeItem('session');
    } catch (e) {
        console.error('Failed to clear localStorage auth data:', e);
    }
}

/**
 * Saves authentication data to storage
 */
export function saveAuthData(session: Session): void {
    if (!isStorageAvailable()) return;

    try {
        localStorage.setItem('session', JSON.stringify(session));
    } catch (e) {
        console.error('Failed to save auth data to localStorage:', e);
    }
}

/**
 * Gets the authentication token if available
 */
export function getAuthToken(): string | null {
    const session = getSession();
    return session?.access_token || null;
}

/**
 * Refreshes the session (not needed with JWT tokens)
 */
export function refreshSession(): void {
    // No action needed - we're using JWT tokens now
}

/**
 * Gets the current user's role
 */
export function getUserRole(): string | null {
    const user = getAuthenticatedUser();
    return user?.role || null;
} 