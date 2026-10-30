import crypto from "crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
function validSession(value?: string) {
  const password=process.env.ADMIN_PASSWORD; const secret=process.env.ADMIN_SESSION_SECRET;
  if(!value||!password||!secret)return false;
  const expected=crypto.createHmac("sha256",secret).update(password).digest("hex");
  const a=Buffer.from(value);const b=Buffer.from(expected);
  return a.length===b.length&&crypto.timingSafeEqual(a,b);
}
function csv(value: unknown){const text=String(value??"");return `"${text.replace(/"/g,'""')}"`;}
export async function GET(){
  const jar=await cookies();
  if(!validSession(jar.get("admin_session")?.value))return NextResponse.json({error:"Unauthorized"},{status:401});
  const [orders,expenses]=await Promise.all([
    prisma.order.findMany({where:{paymentStatus:{in:["PAID","SUCCESS","REFUNDED","PARTIAL_REFUND"]}},include:{product:true,payment:true},orderBy:{createdAt:"asc"}}),
    prisma.operatingExpense.findMany({orderBy:{spentAt:"asc"}}),
  ]);
  const rows=[
    ["Jenis","Tanggal WIB","Referensi","Keterangan","Status","Omzet","Modal aktual","Modal snapshot","Fee pembayaran customer","Pengeluaran"],
    ...orders.map(o=>["ORDER",new Intl.DateTimeFormat("sv-SE",{timeZone:"Asia/Jakarta",dateStyle:"short",timeStyle:"medium"}).format(o.createdAt),o.invoice,o.product.name,o.paymentStatus,o.total,o.providerActualPrice??"",o.providerActualPrice==null?o.providerPriceSnapshot??"":"",Math.max(0,(o.payment?.grossAmount??o.total)-o.total),""]),
    ...expenses.map(e=>["EXPENSE",new Intl.DateTimeFormat("sv-SE",{timeZone:"Asia/Jakarta",dateStyle:"short"}).format(e.spentAt),e.id,e.description,e.category,"","","","",e.amount]),
  ];
  const body="\uFEFF"+rows.map(row=>row.map(csv).join(",")).join("\r\n");
  return new NextResponse(body,{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":'attachment; filename="falintino-keuangan.csv"',"Cache-Control":"no-store"}});
}