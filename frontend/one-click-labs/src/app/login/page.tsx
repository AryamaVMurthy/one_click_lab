"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({ email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  // Validate form inputs
  const validateForm = () => {
    const newErrors = { email: "", password: "" };
    let isValid = true;

    if (!email.trim()) {
      newErrors.email = "Email is required";
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
      isValid = false;
    }

    if (!password) {
      newErrors.password = "Password is required";
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setApiError("");

    // Validate the form
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      // Call the login function from auth context
      const result = await login(email, password);

      if (result.success) {
        // Redirect to dashboard on successful login
        router.push("/");
      } else {
        setApiError(result.error || "Login failed. Please check your credentials.");
      }
    } catch (error) {
      console.error("Error during login:", error);
      setApiError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto bg-card rounded-lg shadow-lg p-8 border border-border-color">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground">Login</h1>
            <p className="text-secondary-foreground mt-2">
              Sign in to your One Click Labs account
            </p>
          </div>

          {apiError && (
            <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 dark:bg-red-900/20 dark:border-red-700/30 dark:text-red-400 rounded-md">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1 text-foreground">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onBlur={() => validateForm()}
                className={`w-full px-4 py-2 rounded-md bg-background border ${
                  errors.email ? "border-red-500 focus:border-red-500" : "border-border-color focus:border-primary"
                } focus:outline-none focus:ring-1 ${errors.email ? "focus:ring-red-500" : "focus:ring-primary"}`}
                placeholder="Enter your email"
                disabled={isSubmitting}
              />
              {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1 text-foreground">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => validateForm()}
                className={`w-full px-4 py-2 rounded-md bg-background border ${
                  errors.password ? "border-red-500 focus:border-red-500" : "border-border-color focus:border-primary"
                } focus:outline-none focus:ring-1 ${errors.password ? "focus:ring-red-500" : "focus:ring-primary"}`}
                placeholder="Enter your password"
                disabled={isSubmitting}
              />
              {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full px-4 py-3 text-lg font-medium bg-primary text-primary-foreground rounded-md hover:opacity-95 transition-all duration-200 ${
                isSubmitting ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {isSubmitting ? (
                <>
                  <span className="mr-2 inline-block w-4 h-4 border-2 border-t-primary-foreground border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></span>
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>

            <div className="text-center mt-4">
              <p className="text-secondary-foreground">
                Don't have an account?{" "}
                <Link href="/register" className="text-primary hover:underline">
                  Register
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
