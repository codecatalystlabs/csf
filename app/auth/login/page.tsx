import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import { LoginForm } from "@/components/auth/login-form"
import { Card, CardContent, CardTitle, CardHeader } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Login",
  description: "Login to your account",
}

export default function LoginPage() {
  return (
		<div className="container relative flex min-h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
			<div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
				<div className="absolute inset-0 bg-zinc-900">
					<Image
						src="/placeholder.svg?height=1080&width=1920"
						width={1920}
						height={1080}
						alt="Authentication"
						className="h-full w-full object-cover opacity-20"
					/>
				</div>
				<div className="relative z-20 flex items-center text-lg font-medium">
					<Image
						src="https://res.cloudinary.com/dacjwtf69/image/upload/v1747973562/mohlogo_zkpnbl.png"
						alt="Logo"
						width={150}
						height={150}
					/>
					<h1 className="mx-4 text-3xl font-semibold tracking-tight">
						Client Satisfaction Feedback
					</h1>
				</div>
				<div className="relative z-20 mt-auto">
					{/* Additional dashboard information */}
					<Card className="bg-white">
						<CardHeader>
							<CardTitle>Dashboard Overview</CardTitle>
						</CardHeader>
						<CardContent>
							<p className="mb-4">
								This dashboard provides real-time
								insights into client satisfaction and
								healthcare facility performance.
							</p>
							<ul className="list-disc list-inside space-y-2">
								<li>
									View metrics by different time
									periods: Today, This Month, Last
									Month, or Cumulative
								</li>
								<li>
									Filter data by Region, District,
									and Facility to narrow your
									analysis
								</li>
								<li>
									Monitor key indicators like client
									satisfaction, gender distribution,
									and more
								</li>
								<li>
									Track potential issues such as
									facilities requesting bribes
								</li>
							</ul>
						</CardContent>
					</Card>
				</div>
			</div>
			<div className="lg:p-8">
				<div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
					<div className="flex flex-col space-y-2 text-center">
						<h1 className="text-2xl font-semibold tracking-tight">
							Sign In
						</h1>
						<p className="text-sm text-muted-foreground">
							Enter your credentials to access your account
						</p>
					</div>
					<LoginForm />
					<p className="px-8 text-center text-sm text-muted-foreground">
						<Link
							href="/auth/register"
							className="hover:text-brand underline underline-offset-4"
						>
							Don&apos;t have an account? Sign up
						</Link>
					</p>
				</div>
			</div>
		</div>
  );
}

