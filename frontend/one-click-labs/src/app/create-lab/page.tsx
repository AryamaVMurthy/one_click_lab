"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createLab } from "@/api/apiClient";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function CreateLabPage() {
  const router = useRouter();
  const { token } = useAuth();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState({ title: "", description: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");

  // Validate form inputs
  const validateForm = () => {
    const newErrors = { title: "", description: "" };
    let isValid = true;

    if (!title.trim()) {
      newErrors.title = "Title is required";
      isValid = false;
    } else if (title.length < 3) {
      newErrors.title = "Title must be at least 3 characters";
      isValid = false;
    }

    if (!description.trim()) {
      newErrors.description = "Description is required";
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
    
    // Check if token exists
    if (!token) {
      setApiError("You must be logged in to create a lab");
      return;
    }

    setIsSubmitting(true);

    try {
      // Call the API to create a new lab
      const response = await createLab(token, {
        title,
        description,
      });

      if (response.success && response.data) {
        // Redirect to the lab editor page with the new lab ID
        router.push(`/edit-lab/${response.data.id}`);
      } else {
        setApiError(response.error || "Failed to create lab. Please try again.");
      }
    } catch (error) {
      console.error("Error creating lab:", error);
      setApiError("An unexpected error occurred. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border-color">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-primary">
            One Click Labs
          </Link>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-foreground">Create New Lab</h1>
            <p className="text-secondary-foreground mt-1">
              Fill in the details below to create your new interactive lab.
            </p>
          </div>

          {apiError && (
            <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 dark:bg-red-900/20 dark:border-red-700/30 dark:text-red-400 rounded-md">
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Lab Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium mb-1 text-foreground">
                Lab Title <span className="text-red-500">*</span>
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => validateForm()}
                className={`w-full px-4 py-2 rounded-md bg-background border ${
                  errors.title ? "border-red-500 focus:border-red-500" : "border-border-color focus:border-primary"
                } focus:outline-none focus:ring-1 ${errors.title ? "focus:ring-red-500" : "focus:ring-primary"}`}
                placeholder="Enter a descriptive title for your lab"
                disabled={isSubmitting}
              />
              {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title}</p>}
              <p className="mt-1 text-xs text-secondary-foreground">
                Choose a clear, descriptive title that explains what your lab is about.
              </p>
            </div>

            {/* Lab Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-1 text-foreground">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => validateForm()}
                className={`w-full px-4 py-2 rounded-md bg-background border ${
                  errors.description ? "border-red-500 focus:border-red-500" : "border-border-color focus:border-primary"
                } focus:outline-none focus:ring-1 ${
                  errors.description ? "focus:ring-red-500" : "focus:ring-primary"
                } min-h-[120px]`}
                placeholder="Provide a brief overview of your lab and what participants will learn"
                disabled={isSubmitting}
              ></textarea>
              {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
              <p className="mt-1 text-xs text-secondary-foreground">
                Give a concise summary of what your lab covers and the outcomes learners can expect.
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-between pt-4">
              <Link
                href="/"
                className="px-4 py-2 text-secondary-foreground border border-border-color rounded-md hover:bg-secondary transition-colors"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-6 py-3 text-lg font-medium bg-primary text-primary-foreground rounded-md hover:opacity-95 hover:shadow-lg hover:translate-y-[-1px] shadow-md transition-all duration-200 inline-flex items-center justify-center border-2 border-primary/20 ${
                  isSubmitting ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {isSubmitting ? (
                  <>
                    <span className="mr-2 inline-block w-4 h-4 border-2 border-t-primary-foreground border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></span>
                    Creating...
                  </>
                ) : (
                  "Create Lab"
                )}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
