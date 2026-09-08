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
      whileHover={{ y: -6 }}
      transition={{ duration: 0.2 }}
    >
      <Link
        href={href}
        className={`
          group
          flex
          h-full
          flex-col
          justify-between
          rounded-3xl
          border
          p-6
          transition-all
          duration-300

          ${
            featured
              ? "border-blue-500/40 bg-gradient-to-br from-blue-600/20 to-slate-900"
              : "border-slate-800 bg-slate-900/70 hover:border-blue-500/50"
          }

          hover:shadow-[0_0_40px_rgba(37,99,235,.18)]
        `}
      >
        <div className="flex items-center justify-between">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600/15">
            <Icon className="h-7 w-7 text-blue-500 transition group-hover:scale-110" />
          </div>

          <ArrowUpRight className="h-5 w-5 text-slate-500 group-hover:text-blue-500" />
        </div>

        <div className="mt-8">
          <h3 className="text-2xl font-bold text-white">
            {title}
          </h3>

          <p className="mt-3 text-sm leading-7 text-slate-400">
            {description}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}