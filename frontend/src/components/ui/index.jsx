import React, { useEffect, useRef, useState } from "react";

export { Pagination } from "./Pagination";

export function Button({ children, variant = "primary", className = "", ...props }) {
  const baseClasses = "px-6 py-2.5 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";
  const variants = {
    primary: "bg-primary-600 text-white hover:bg-primary-700 hover:shadow-lg hover:shadow-primary-500/25",
    secondary: "bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 hover:bg-gray-200 dark:hover:bg-slate-700",
    outline: "border-2 border-primary-600 text-primary-600 dark:text-primary-100 hover:bg-primary-50 dark:hover:bg-primary-900/30",
    danger: "bg-red-600 text-white hover:bg-red-700"
  };
  return (
    <button className={`${baseClasses} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Input({ className = "", ...props }) {
  return <input className={`w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 placeholder-gray-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${className}`} {...props} />;
}

export function Select({ className = "", children, ...props }) {
  return (
    <select
      className={`w-full px-4 py-2.5 border border-gray-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function Toggle({ checked, onChange, label, description, disabled = false }) {
  return (
    <label className={`flex items-start justify-between gap-4 ${disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}>
      <span className="min-w-0">
        <span className="block text-sm font-medium text-gray-900 dark:text-slate-100">{label}</span>
        {description && <span className="mt-0.5 block text-xs leading-relaxed text-gray-500 dark:text-slate-400">{description}</span>}
      </span>
      <span className="relative mt-0.5 inline-flex shrink-0 items-center">
        <input type="checkbox" className="peer sr-only" checked={checked} onChange={onChange} disabled={disabled} />
        <span className="h-6 w-11 rounded-full bg-gray-300 transition-colors duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500 peer-focus-visible:ring-offset-2 dark:bg-slate-600 dark:peer-focus-visible:ring-offset-slate-800 peer-checked:bg-teal-600" />
        <span className="pointer-events-none absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200 peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

export function Spinner({ size = "md" }) {
  const sizes = { sm: "h-4 w-4", md: "h-6 w-6", lg: "h-8 w-8" };
  return <div className={`animate-spin ${sizes[size]} border-2 border-primary-600 border-t-transparent rounded-full`}></div>;
}

export function Skeleton({ className = "" }) {
  return <div className={`animate-pulse rounded-md bg-gray-200 dark:bg-slate-700 ${className}`} />;
}

export function SkeletonCard() {
  return (
    <div className="h-64 md:h-72 overflow-hidden rounded-2xl shadow-sm bg-gray-100 dark:bg-slate-800">
      <Skeleton className="h-full w-full rounded-none" />
    </div>
  );
}

export function Reveal({ children, className = "", delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08, rootMargin: "0px 0px -40px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${visible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"} ${className}`}
    >
      {children}
    </div>
  );
}

export function ReadingProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const update = () => {
      const scrollTop = window.scrollY || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(height > 0 ? Math.min(100, Math.max(0, (scrollTop / height) * 100)) : 0);
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div className="fixed inset-x-0 top-0 z-[60] h-0.5 bg-transparent" aria-hidden="true">
      <div className="h-full bg-teal-400 transition-[width] duration-150 ease-out" style={{ width: `${progress}%` }} />
    </div>
  );
}

export function BackToTop() {
  const [show, setShow] = React.useState(false);
  useEffect(() => {
    const handler = () => {
      if (window.pageYOffset > 300) setShow(true);
      else setShow(false);
    };
    handler();
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);
  return (
    <Button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-6 right-6 z-10 bg-teal-600 text-white rounded-full p-2 shadow-lg hover:bg-teal-700 transition-colors"
      disabled={!show}
    >
      ↑
    </Button>
  );
}

export function EmptyState({ message, icon: Icon }) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-10 text-center text-gray-500 dark:text-slate-400 sm:py-12">
      {Icon && <Icon className="w-12 h-12 text-gray-400" />}
      <p className="text-base sm:text-lg">{message}</p>
    </div>
  );
}

export function Card({ children, className = "" }) {
  return (
    <div className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 hover:shadow-md transition-shadow duration-200 ${className}`}>
      {children}
    </div>
  );
}

