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

export default function ServiceCard({
  title,
  description,
  href,
  icon: Icon,
  featured = false,
}: ServiceCardProps) {
  return (
    <motion.div
      className="h-full min-w-0"
      whileHover={{ y: -6 }}
      transition={{ duration: 0.2 }}
    >
      <Link
        href={href}
        className={`
          group
          flex
          h-full
          min-h-[210px]
          min-w-0
          flex-col
          justify-between
          rounded-2xl
          border
          p-4
          transition-all
          duration-300
          sm:rounded-3xl
          sm:p-5
          lg:min-h-[250px]

          ${
            featured
              ? "border-blue-500/40 bg-gradient-to-br from-blue-600/20 to-slate-900"
              : "border-slate-800 bg-slate-900/70 hover:border-blue-500/50"
          }

          hover:shadow-[0_0_40px_rgba(37,99,235,.18)]
        `}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-600/15 sm:h-12 sm:w-12 sm:rounded-2xl">
            <Icon className="h-5 w-5 text-blue-500 transition group-hover:scale-110 sm:h-6 sm:w-6" />
          </div>

          <ArrowUpRight className="h-4 w-4 shrink-0 text-slate-500 group-hover:text-blue-500 sm:h-5 sm:w-5" />
        </div>

        <div className="mt-5 min-w-0">
          <h3 className="break-words text-base font-bold text-white sm:text-xl lg:text-lg xl:text-xl">
            {title}
          </h3>

          <p className="mt-2 break-words text-xs leading-5 text-slate-400 sm:mt-3 sm:text-sm sm:leading-6">
            {description}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
