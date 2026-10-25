import { redirect } from "next/navigation";
import { isAdminAuthenticated } from "@/lib/admin-auth";
import GameCatalogClient from "./GameCatalogClient";

export const dynamic = "force-dynamic";

export default async function GameCatalogAdminPage() {
  if (!(await isAdminAuthenticated())) redirect("/admin/login");
  return <GameCatalogClient />;
}
