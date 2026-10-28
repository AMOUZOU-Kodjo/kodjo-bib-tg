import React from "react";

export { Pagination } from "./Pagination";

export function Button({ children, variant = "primary", className = "", ...props }) {
  const baseClasses = "px-6 py-2.5 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-primary-600 text-white hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-500/25",
    secondary: "bg-gray-100 text-gray-700 hover:bg-gray-200",
    outline: "border-2 border-primary-600 text-primary-600 hover:bg-primary-50",
    danger: "bg-red-600 text-white hover:bg-red-700"
  };
  return (
    <button className={`${baseClasses} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Input({ className = "", ...props }) {
  return <input className={`w-full px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${className}`} {...props} />;
}

export function Spinner({ size = "md" }) {
  const sizes = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-8 w-8" };
  return <div className={`animate-spin ${sizes[size]} border-2 border-primary-600 border-t-transparent rounded-full`}></div>;
}

export function EmptyState({ message, icon: Icon }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-10 text-center text-gray-500 sm:py-12">
      {Icon && <Icon className="w-12 h-12 text-gray-400" />}
      <p className="text-base sm:text-lg">{message}</p>
    </div>
  );
}

export function Card({ children, className = "" }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 ${className}`}>
      {children}
    </div>
  );
}

