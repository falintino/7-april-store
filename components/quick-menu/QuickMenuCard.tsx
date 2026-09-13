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
      className="group relative min-w-0 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/60 p-3 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500 hover:shadow-[0_0_30px_rgba(37,99,235,.2)] sm:p-5 lg:p-6"
    >
      <div className="flex items-center justify-between gap-1 sm:gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600/15 sm:h-12 sm:w-12 lg:h-14 lg:w-14">
          <Icon className="h-5 w-5 text-blue-500 transition group-hover:scale-110 sm:h-6 sm:w-6 lg:h-7 lg:w-7" />
        </div>

        <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-500 transition group-hover:text-blue-500 lg:h-5 lg:w-5" />
      </div>

      <h3 className="mt-3 break-words text-xs font-semibold leading-5 text-white sm:mt-4 sm:text-base lg:mt-5 lg:text-lg">
        {title}
      </h3>
    </Link>
  );
}
