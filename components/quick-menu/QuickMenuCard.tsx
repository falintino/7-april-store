"use client";

import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface QuickMenuCardProps {
  title: string;
  href: string;
  icon: LucideIcon;
}

export default function QuickMenuCard({ title, href, icon: Icon }: QuickMenuCardProps) {
  return (
    <Link
      href={href}
      className="group flex min-w-0 flex-col items-center overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 px-1 py-3 text-center transition-all duration-300 hover:-translate-y-1 hover:border-blue-500 hover:shadow-[0_0_30px_rgba(37,99,235,.2)] sm:items-start sm:rounded-2xl sm:p-5 sm:text-left lg:p-6"
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600/15 sm:h-12 sm:w-12 sm:rounded-xl lg:h-14 lg:w-14">
        <Icon className="h-4 w-4 text-blue-500 transition group-hover:scale-110 sm:h-6 sm:w-6 lg:h-7 lg:w-7" />
      </div>

      <h3 className="mt-2 w-full break-words text-[10px] font-semibold leading-3 text-white sm:mt-4 sm:text-base sm:leading-normal lg:mt-5 lg:text-lg">
        {title}
      </h3>
    </Link>
  );
}
