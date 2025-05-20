"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/app/context/auth-context";
import { Loader } from "@/components/ui/loader";
import { loginUser } from "@/lib/api-utils";

const formSchema = z.object({
	username: z.string().min(2, {
		message: "Username must be at least 2 characters.",
	}),
	password: z.string().min(4, {
		message: "Password must be at least 4 characters.",
	}),
});

export function LoginForm() {
	const router = useRouter();
	const { login } = useAuth();
	const [isLoading, setIsLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			username: "",
			password: "",
		},
	});

	async function onSubmit(values: z.infer<typeof formSchema>) {
		setIsLoading(true);
		console.log("Attempting login with username:", values.username);

		try {
			// Check network connectivity first
			const isOnline = navigator.onLine;
			if (!isOnline) {
				throw new Error(
					"You appear to be offline. Please check your internet connection and try again."
				);
			}

			// Show a toast to indicate login is in progress
			toast({
				title: "Logging in",
				description: "Attempting to connect to the server...",
				duration: 3000,
			});

			// Use the loginUser function with the new endpoint
			const data = await loginUser(values.username, values.password);
			console.log("Login response:", data);

			// The new API returns { access_token, user } directly
			if (data && data.user) {
				// Login with the auth context
				login(data);

				toast({
					title: "Success",
					description:
						"Login successful. Redirecting to dashboard...",
					duration: 3000,
				});

				// Redirect to dashboard immediately
				router.push("/dashboard");
			} else {
				toast({
					title: "Error",
					description:
						"Login failed. Unexpected response format.",
					variant: "destructive",
				});
			}
		} catch (error) {
			console.error("Login error:", error);

			// Show comprehensive error message to the user
			toast({
				title: "Login Failed",
				description:
					error instanceof Error
						? error.message
						: "Failed to connect to the server. Please try again later.",
				variant: "destructive",
				duration: 5000,
			});
		} finally {
			setIsLoading(false);
		}
	}

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(onSubmit)}
				className="space-y-4"
			>
				<FormField
					control={form.control}
					name="username"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Username</FormLabel>
							<FormControl>
								<Input
									placeholder="Enter your username"
									{...field}
								/>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="password"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Password</FormLabel>
							<FormControl>
								<div className="relative">
									<Input
										type={
											showPassword
												? "text"
												: "password"
										}
										placeholder="••••••••"
										{...field}
									/>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
										onClick={() =>
											setShowPassword(
												!showPassword
											)
										}
									>
										{showPassword ? (
											<EyeOff className="h-4 w-4" />
										) : (
											<Eye className="h-4 w-4" />
										)}
										<span className="sr-only">
											{showPassword
												? "Hide password"
												: "Show password"}
										</span>
									</Button>
								</div>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
				<Button
					type="submit"
					className="w-full"
					disabled={isLoading}
				>
					{isLoading ? (
						<>
							<Loader
								size="sm"
								showText={false}
								className="mr-2"
							/>
							Please wait
						</>
					) : (
						"Sign In"
					)}
				</Button>
			</form>
		</Form>
	);
}
