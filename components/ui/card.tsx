import { cn } from "@/lib/cn";

interface Props {
  children: React.ReactNode;
  className?: string;
}

export default function Card({
  children,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "rounded-3xl border border-slate-800 bg-slate-900/70 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-blue-500 hover:shadow-[0_0_40px_rgba(37,99,235,.18)]",
        className
      )}
    >
      {children}
    </div>
  );
}