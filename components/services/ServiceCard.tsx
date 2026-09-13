"use client";

import Link from "next/link";
import { ArrowUpRight, LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface ServiceCardProps {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  featured?: boolean;
}

export default function ServiceCard({ title, description, href, icon: Icon, featured = false }: ServiceCardProps) {
  return (
    <motion.div className="h-full min-w-0" whileHover={{ y: -6 }} transition={{ duration: 0.2 }}>
      <Link
        href={href}
        className={`group flex h-full min-h-[105px] min-w-0 flex-col items-center justify-center rounded-xl border px-1 py-3 text-center transition-all duration-300 sm:min-h-[210px] sm:items-stretch sm:justify-between sm:rounded-3xl sm:p-5 sm:text-left lg:min-h-[250px] ${
          featured
            ? "border-blue-500/40 bg-gradient-to-br from-blue-600/20 to-slate-900"
            : "border-slate-800 bg-slate-900/70 hover:border-blue-500/50"
        } hover:shadow-[0_0_40px_rgba(37,99,235,.18)]`}
      >
        <div className="flex items-center justify-center sm:justify-between sm:gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-600/15 sm:h-12 sm:w-12 sm:rounded-2xl">
            <Icon className="h-4 w-4 text-blue-500 transition group-hover:scale-110 sm:h-6 sm:w-6" />
          </div>
          <ArrowUpRight className="hidden h-5 w-5 shrink-0 text-slate-500 group-hover:text-blue-500 sm:block" />
        </div>

        <div className="mt-2 min-w-0 sm:mt-5">
          <h3 className="break-words text-[9px] font-bold leading-3 text-white sm:text-xl sm:leading-normal lg:text-lg xl:text-xl">{title}</h3>
          <p className="mt-3 hidden break-words text-sm leading-6 text-slate-400 sm:block">{description}</p>
        </div>
      </Link>
    </motion.div>
  );
}
