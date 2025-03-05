"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  // Validate form inputs
  const validateForm = () => {
    const newErrors = { name: "", email: "", password: "", confirmPassword: "" };
    let isValid = true;

    if (!name.trim()) {
      newErrors.name = "Name is required";
      isValid = false;
    }

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
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
      isValid = false;
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
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
      // Call the register function from auth context
      const result = await register(name, email, password);

      if (result.success) {
        // Redirect to login page on successful registration
        router.push("/login?registered=true");
      } else {
        setApiError(result.error || "Registration failed. Please try again.");
      }
    } catch (error) {
      console.error("Error during registration:", error);
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
            <h1 className="text-3xl font-bold text-foreground">Register</h1>
            <p className="text-secondary-foreground mt-2">
              Create your One Click Labs account
            </p>
          </div>

          {apiError && (
            <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 dark:bg-red-900/20 dark:border-red-700/30 dark:text-red-400 rounded-md">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-1 text-foreground">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => validateForm()}
                className={`w-full px-4 py-2 rounded-md bg-background border ${
                  errors.name ? "border-red-500 focus:border-red-500" : "border-border-color focus:border-primary"
                } focus:outline-none focus:ring-1 ${errors.name ? "focus:ring-red-500" : "focus:ring-primary"}`}
                placeholder="Enter your full name"
                disabled={isSubmitting}
              />
              {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
            </div>

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
                placeholder="Create a password"
                disabled={isSubmitting}
              />
              {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1 text-foreground">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => validateForm()}
                className={`w-full px-4 py-2 rounded-md bg-background border ${
                  errors.confirmPassword ? "border-red-500 focus:border-red-500" : "border-border-color focus:border-primary"
                } focus:outline-none focus:ring-1 ${errors.confirmPassword ? "focus:ring-red-500" : "focus:ring-primary"}`}
                placeholder="Confirm your password"
                disabled={isSubmitting}
              />
              {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>}
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
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </button>

            <div className="text-center mt-4">
              <p className="text-secondary-foreground">
                Already have an account?{" "}
                <Link href="/login" className="text-primary hover:underline">
                  Sign In
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
