import type { Metadata } from "next";
import { BribePageClient } from "@/components/dashboard/bribe-page-client";

export const metadata: Metadata = {
	title: "Bribe Analysis",
	description: "Analyze bribe payments by region",
};

export default function BribePage() {
	return <BribePageClient />;
}
