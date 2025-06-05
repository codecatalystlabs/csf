import type { Metadata } from "next";
import { AccountsPageClient } from "@/components/dashboard/accounts-page-client";

export const metadata: Metadata = {
	title: "Regional Satisfaction Rate",
	description: "Regional Satisfaction Rate",
};

export default function AccountsPage() {
	return <AccountsPageClient />;
}
