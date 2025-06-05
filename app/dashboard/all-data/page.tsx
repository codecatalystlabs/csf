import type { Metadata } from "next";
import { AllDataPageClient } from "@/components/dashboard/all-data-page-client";

export const metadata: Metadata = {
	title: "All Satisfaction Data",
	description: "View and filter all client satisfaction survey data",
};

export default function AllDataPage() {
	return <AllDataPageClient />;
}
