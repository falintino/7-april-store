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
      className="min-w-[230px] flex-none snap-start sm:min-w-[270px] lg:min-w-0"
      whileHover={{ y: -6 }}
      transition={{ duration: 0.2 }}
    >
      <Link
        href={href}
        className={`
          group
          flex
          h-full
          min-h-[220px]
          flex-col
          justify-between
          rounded-3xl
          border
          p-5
          transition-all
          duration-300
          sm:p-6
          lg:min-h-[250px]
          lg:p-5

          ${
            featured
              ? "border-blue-500/40 bg-gradient-to-br from-blue-600/20 to-slate-900"
              : "border-slate-800 bg-slate-900/70 hover:border-blue-500/50"
          }

          hover:shadow-[0_0_40px_rgba(37,99,235,.18)]
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/15">
            <Icon className="h-6 w-6 text-blue-500 transition group-hover:scale-110" />
          </div>

          <ArrowUpRight className="h-5 w-5 text-slate-500 group-hover:text-blue-500" />
        </div>

        <div className="mt-7">
          <h3 className="text-xl font-bold text-white lg:text-lg xl:text-xl">
            {title}
          </h3>

          <p className="mt-3 text-sm leading-6 text-slate-400">
            {description}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
