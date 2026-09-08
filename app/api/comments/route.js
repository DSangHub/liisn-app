import { NextResponse } from "next/server";
import { addComment, listComments, nearby } from "../../../lib/comments";

export async function GET(req) {
  const url = new URL(req.url);
  const lat = url.searchParams.get("lat");
  const lng = url.searchParams.get("lng");
  let rows = await listComments();
  if (lat && lng) rows = nearby(rows, Number(lat), Number(lng));
  return NextResponse.json({ comments: rows.slice(0, 50) });
}

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const business_name = String(body.business_name || "").trim();
  const text = String(body.body || body.comment || "").trim();
  if (business_name.length < 2) return NextResponse.json({ error: "Business name required" }, { status: 400 });
  if (text.length < 3) return NextResponse.json({ error: "Comment required" }, { status: 400 });
  const row = await addComment({ business_name, body: text, lat: body.lat, lng: body.lng, place_label: body.place_label });
  return NextResponse.json({ ok: true, comment: row });
}
