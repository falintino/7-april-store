import { LucideIcon } from "lucide-react";

export interface Service {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
  featured?: boolean;
}