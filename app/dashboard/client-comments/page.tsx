import type { Metadata } from "next";
import { ClientCommentsPageClient } from "@/components/dashboard/client-comments-page-client";

export const metadata: Metadata = {
	title: "Client Comments",
	description: "View and filter client feedback comments",
};

export default function ClientCommentsPage() {
	return <ClientCommentsPageClient />;
}
