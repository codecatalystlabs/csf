import { getAuthToken, refreshSession, saveAuthData } from './auth-utils';
import { AUTH_ENDPOINTS } from './api-config';

/**
 * Creates fetch options with authentication token if available
 * 
 * @param options - Optional fetch options to merge with auth headers
 * @returns Fetch options with auth headers if a token exists
 */
export function createAuthHeaders(options: RequestInit = {}): RequestInit {
    const token = getAuthToken();

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...options.headers as Record<string, string>,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // Merge with existing options
    return {
        ...options,
        headers,
        mode: 'cors' as RequestMode,
    };
}

/**
 * Fetch wrapper that automatically adds auth token and handles session refresh
 * 
 * @param url - URL to fetch
 * @param options - Fetch options
 * @returns Promise with the fetch response
 */
export async function fetchWithAuth(url: string, options: RequestInit = {}): Promise<Response> {
    // Add auth token to request if available
    const authOptions = createAuthHeaders(options);

    // Make the fetch request
    const response = await fetch(url, authOptions);

    // If successful, refresh the session expiration
    if (response.ok) {
        refreshSession();
    }

    return response;
}

/**
 * Logs in a user with the provided credentials
 */
export async function loginUser(username: string, password: string) {
    console.log(`API: Attempting to login user ${username}`);

    try {
        console.log(`API: Using login endpoint: ${AUTH_ENDPOINTS.LOGIN}`);

        // Create abort controller for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        const response = await fetch(AUTH_ENDPOINTS.LOGIN, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ username, password }),
            signal: controller.signal,
            mode: 'cors'
        });

        // Clear timeout since we got a response
        clearTimeout(timeoutId);


        const data = await response.json();

        if (!response.ok) {
            const errorMsg = data.message || 'Unknown error';
            console.error(`API: Login error: ${errorMsg}`);
            throw new Error(errorMsg);
        }

        // Save the session data to localStorage
        saveAuthData({
            access_token: data.access_token,
            user: data.user
        });

        // If we got here, login was successful
        console.log(`API: Login successful`);

        // Return the data directly, since it already has the right structure
        return data;
    }
    catch (error: unknown) {
        // Handle different error types safely
        if (error instanceof Error) {
            // Handle AbortError (timeout) separately
            if (error.name === 'AbortError') {
                console.error(`API: Login request timed out`);
                throw new Error('Login request timed out after 10 seconds');
            } else {
                console.error(`API: Login error:`, error);
                throw error;
            }
        } else {
            console.error(`API: Unknown login error`);
            throw new Error('Unknown login error');
        }
    }
}

/**
 * Fetcher function for SWR to use with authentication
 * 
 * @param url - URL to fetch
 * @returns Promise with the JSON response
 */
export const authFetcher = async (url: string) => {
    const res = await fetchWithAuth(url);

    // If the request returns 401 Unauthorized, we might want to redirect to login
    if (res.status === 401) {
        // Only redirect if we're in the browser
        if (typeof window !== 'undefined') {
            window.location.href = '/auth/login';
        }
        throw new Error('Unauthorized');
    }

    return res.json();
}; 