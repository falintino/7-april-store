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
    <motion.div whileHover={{ y: -6 }}>
      <Link
        href={href}
        className="group block overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 transition duration-300 hover:border-blue-500 hover:shadow-[0_0_35px_rgba(37,99,235,.2)]"
      >
        <div className="aspect-[4/5] overflow-hidden">
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
          />
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white">
              {title}
            </h3>

            <ArrowRight className="h-5 w-5 text-slate-400 group-hover:text-blue-500" />
          </div>

          <p className="mt-2 text-sm text-slate-400">
            Top Up Sekarang
          </p>
        </div>
      </Link>
    </motion.div>
  );
}