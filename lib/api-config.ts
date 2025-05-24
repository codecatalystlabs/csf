/**
 * API Configuration
 * 
 * This file contains API-related constants and endpoint builder functions
 * to ensure consistency across the application.
 */

// Base API URL
// export const BASE_URL = "http://localhost:9000";
export const BASE_URL = "https://csf.health.go.ug/api";


// Auth endpoints
export const AUTH_ENDPOINTS = {
    LOGIN: `${BASE_URL}/login`,
    LOGOUT: `${BASE_URL}/logout`,
    REFRESH: `${BASE_URL}/auth/refresh`
};

// Location endpoints
export const LOCATION_ENDPOINTS = {
    // Get all regions
    REGIONS: `${BASE_URL}/get_locations?location=region`,



    // Build endpoint for districts of a region
    getDistrictsForRegion: (region: string) =>
        `${BASE_URL}/get_locations?location=district&parent=${region}`,

    // Build endpoint for facilities in a district
    getFacilitiesForDistrict: (district: string) =>
        `${BASE_URL}/get_locations?location=facility&parent=${district}`
};

// Dashboard endpoints
export const DASHBOARD_ENDPOINTS = {
    // Get dashboard visualization data
    DASHBOARD_VISUALIZATION: `${BASE_URL}/dashboard_data`,

    // Get satisfaction trend data
    SATISFACTION_TREND: `${BASE_URL}/satisfaction_trends`,

    // Get all satisfaction data with pagination and filters
    ALL_SATISFACTION_DATA: `${BASE_URL}/visualization/all-satisfaction-data`,

    // Get client comments with pagination and filters
    CLIENT_COMMENTS: `${BASE_URL}/comments`,

    // Get dashboard data with optional filters
    DASHBOARD_DATA: `${BASE_URL}/dashboard/data`,

    // Build endpoint for filtered dashboard data
    getFilteredDashboardData: (filters: {
        region?: string;
        district?: string;
        facility?: string;
        period?: string;
        start_year?: number;
        end_year?: number;
        role?: string;
    }) => {
        const params = new URLSearchParams();

        if (filters.period) params.append("period", filters.period);
        if (filters.region) params.append("region", filters.region);
        if (filters.district) params.append("district", filters.district);
        if (filters.facility) params.append("facility", filters.facility);
        if (filters.role) params.append("role", filters.role);
        if (filters.start_year) params.append("start_year", filters.start_year.toString());
        if (filters.end_year) params.append("end_year", filters.end_year.toString());

        const queryString = params.toString();
        return `${BASE_URL}/dashboard_data${queryString ? `?${queryString}` : ''}`;
    }
};

// Export default config object for convenience
export default {
    BASE_URL,
    AUTH: AUTH_ENDPOINTS,
    LOCATION: LOCATION_ENDPOINTS,
    DASHBOARD: DASHBOARD_ENDPOINTS
}; 