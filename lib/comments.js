import { promises as fs } from "fs";
import path from "path";
import crypto from "crypto";

const LOCAL = path.join(process.cwd(), "data", "comments.json");
const KNOWN = [
  { slug: "safeway", names: ["safeway", "vons"], kind: "retailer" },
  { slug: "target", names: ["target"], kind: "retailer" },
  { slug: "walmart", names: ["walmart", "wal-mart"], kind: "retailer" },
  { slug: "costco", names: ["costco"], kind: "retailer" },
  { slug: "starbucks", names: ["starbucks"], kind: "retailer" },
  { slug: "tide", names: ["tide", "p&g"], kind: "manufacturer" },
  { slug: "apple", names: ["apple", "apple store"], kind: "manufacturer" },
  { slug: "samsung", names: ["samsung"], kind: "manufacturer" },
];
const SEED = [
  { id: "seed-1", business_name: "Safeway", body: "Deli sandwich packed wrong. Store should hear this, not Yelp.", lat: 38.582, lng: -121.494, place_label: "Sacramento, CA", match: { slug: "safeway", display: "Safeway", kind: "retailer", confidence: 0.96 }, created_at: "2026-09-07T18:11:00.000Z" },
  { id: "seed-2", business_name: "Tide", body: "Cap still leaks in the trunk.", lat: 38.574, lng: -121.47, place_label: "Sacramento, CA", match: { slug: "tide", display: "Tide", kind: "manufacturer", confidence: 0.91 }, created_at: "2026-09-08T16:02:00.000Z" },
];

function norm(s) {
  return String(s || "").toLowerCase().replace(/[^a-z0-9&+ ]/g, " ").replace(/\s+/g, " ").trim();
}

export function detectBusiness(businessName, body = "") {
  const hay = `${norm(businessName)} ${norm(body)}`;
  let best = null;
  for (const org of KNOWN) {
    for (const n of org.names) {
      if (hay.includes(n)) {
        const confidence = norm(businessName).includes(n) ? 0.95 : 0.72;
        if (!best || confidence > best.confidence) {
          best = { slug: org.slug, display: org.names[0], kind: org.kind, confidence };
        }
      }
    }
  }
  if (!best && businessName) {
    best = { slug: norm(businessName).replace(/ /g, "-").slice(0, 48) || "unknown", display: String(businessName).trim(), kind: "unknown", confidence: 0.4 };
  }
  return best;
}

async function upstash(command) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const res = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify(command) });
  if (!res.ok) throw new Error("Upstash error");
  return res.json();
}

async function readLocal() {
  try { return JSON.parse(await fs.readFile(LOCAL, "utf8")); } catch { return [...SEED]; }
}

export function coarse(n) {
  const x = Number(n);
  return Number.isFinite(x) ? Math.round(x * 1000) / 1000 : null;
}

export async function addComment(input) {
  const row = {
    id: crypto.randomUUID(),
    business_name: String(input.business_name).trim().slice(0, 80),
    body: String(input.body).trim().slice(0, 500),
    lat: coarse(input.lat),
    lng: coarse(input.lng),
    place_label: input.place_label ? String(input.place_label).slice(0, 80) : null,
    match: detectBusiness(input.business_name, input.body),
    created_at: new Date().toISOString(),
  };
  const redis = await upstash(["LPUSH", "liisn:comments", JSON.stringify(row)]);
  if (redis) await upstash(["LTRIM", "liisn:comments", 0, 499]);
  else {
    await fs.mkdir(path.dirname(LOCAL), { recursive: true });
    const rows = await readLocal();
    rows.unshift(row);
    await fs.writeFile(LOCAL, JSON.stringify(rows.slice(0, 500), null, 2));
  }
  return row;
}

export async function listComments() {
  const redis = await upstash(["LRANGE", "liisn:comments", 0, 49]);
  if (redis && Array.isArray(redis.result)) {
    const rows = redis.result.map((s) => { try { return JSON.parse(s); } catch { return null; } }).filter(Boolean);
    return rows.length ? rows : SEED;
  }
  return readLocal();
}

export function nearby(rows, lat, lng, km = 40) {
  if (lat == null || lng == null) return rows;
  return rows.map((r) => ({ ...r, km: haversine(lat, lng, r.lat, r.lng) })).filter((r) => r.km == null || r.km <= km).sort((a, b) => (a.km ?? 9e9) - (b.km ?? 9e9));
}

function haversine(a, b, c, d) {
  if (![a, b, c, d].every(Number.isFinite)) return null;
  const R = 6371;
  const dLat = ((c - a) * Math.PI) / 180;
  const dLng = ((d - b) * Math.PI) / 180;
  const s = Math.sin(dLat / 2) ** 2 + Math.cos((a * Math.PI) / 180) * Math.cos((c * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
}
