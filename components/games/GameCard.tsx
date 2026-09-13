"use client";

import Link from "next/link";
import { motion } from "framer-motion";

interface GameCardProps {
  title: string;
  image: string;
  href: string;
}

export default function GameCard({ title, image, href }: GameCardProps) {
  return (
    <motion.div whileHover={{ y: -6 }} className="h-full min-w-0">
      <Link
        href={href}
        className="group flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-slate-800 bg-slate-900 transition duration-300 hover:border-blue-500 hover:shadow-[0_0_35px_rgba(37,99,235,.2)] sm:rounded-2xl lg:rounded-3xl"
      >
        <div className="aspect-[4/5] overflow-hidden">
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
          />
        </div>

        <div className="flex min-h-[64px] flex-1 flex-col p-2 sm:min-h-[92px] sm:p-4 lg:min-h-[116px] lg:p-5">
          <h3 className="line-clamp-2 text-xs font-bold leading-4 text-white sm:text-sm sm:leading-5 lg:text-base lg:leading-6">
            {title}
          </h3>
          <p className="mt-auto hidden pt-2 text-sm text-slate-400 sm:block">
            Top Up Sekarang
          </p>
        </div>
      </Link>
    </motion.div>
  );
}