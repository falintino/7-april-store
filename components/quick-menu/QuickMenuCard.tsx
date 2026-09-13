"use client";

import Link from "next/link";
import { ArrowUpRight, LucideIcon } from "lucide-react";

interface QuickMenuCardProps {
  title: string;
  href: string;
  icon: LucideIcon;
}

export default function QuickMenuCard({
  title,
  href,
  icon: Icon,
}: QuickMenuCardProps) {
  return (
    <Link
      href={href}
      className="group relative min-w-[128px] flex-none snap-start overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-4 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500 hover:shadow-[0_0_30px_rgba(37,99,235,.2)] sm:min-w-[150px] sm:p-5 lg:min-w-0 lg:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600/15 sm:h-12 sm:w-12 lg:h-14 lg:w-14">
          <Icon className="h-6 w-6 text-blue-500 transition group-hover:scale-110 lg:h-7 lg:w-7" />
        </div>

        <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-500 transition group-hover:text-blue-500 lg:h-5 lg:w-5" />
      </div>

      <h3 className="mt-4 whitespace-nowrap text-sm font-semibold text-white sm:text-base lg:mt-5 lg:text-lg">
        {title}
      </h3>
    </Link>
  );
}
