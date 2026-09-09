"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

interface GameCardProps {
  title: string;
  image: string;
  href: string;
}

export default function GameCard({
  title,
  image,
  href,
}: GameCardProps) {
  return (
    <motion.div whileHover={{ y: -6 }} className="h-full">
      <Link
        href={href}
        className="group flex h-full flex-col overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 transition duration-300 hover:border-blue-500 hover:shadow-[0_0_35px_rgba(37,99,235,.2)]"
      >
        <div className="aspect-[4/5] overflow-hidden">
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
          />
        </div>

        <div className="flex min-h-[116px] flex-col p-5">
          <div className="flex items-start justify-between gap-2">
            <h3 className="min-h-12 font-bold leading-6 text-white">
              {title}
            </h3>

            <ArrowRight className="mt-0.5 h-5 w-5 shrink-0 text-slate-400 group-hover:text-blue-500" />
          </div>

          <p className="mt-auto pt-2 text-sm text-slate-400">
            Top Up Sekarang
          </p>
        </div>
      </Link>
    </motion.div>
  );
}