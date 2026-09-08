import { NextResponse } from "next/server";
import { addWaitlist } from "../../../lib/waitlist";

const ROLES = new Set(["buyer", "seller", "both"]);

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const role = String(body.role || "buyer");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }
  if (!ROLES.has(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }
  const row = await addWaitlist({ email, role });
  return NextResponse.json({ ok: true, email: row.email });
}
