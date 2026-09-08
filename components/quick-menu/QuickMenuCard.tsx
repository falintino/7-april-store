"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { LucideIcon } from "lucide-react";

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
      className="
        group
        relative
        overflow-hidden
        rounded-2xl
        border
        border-slate-800
        bg-slate-900/60
        p-6
        transition-all
        duration-300
        hover:-translate-y-1
        hover:border-blue-500
        hover:shadow-[0_0_30px_rgba(37,99,235,.2)]
      "
    >
      <div className="flex items-center justify-between">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-600/15">
          <Icon className="h-7 w-7 text-blue-500 transition group-hover:scale-110" />
        </div>

        <ArrowUpRight className="h-5 w-5 text-slate-500 transition group-hover:text-blue-500" />
      </div>

      <h3 className="mt-5 text-lg font-semibold text-white">
        {title}
      </h3>
    </Link>
  );
}