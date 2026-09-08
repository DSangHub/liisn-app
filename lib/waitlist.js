import { promises as fs } from "fs";
import path from "path";

const LOCAL = path.join(process.cwd(), "data", "waitlist.json");

async function upstash(command) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(command),
  });
  if (!res.ok) throw new Error("Upstash error");
  return res.json();
}

async function readLocal() {
  try { return JSON.parse(await fs.readFile(LOCAL, "utf8")); } catch { return []; }
}

export async function addWaitlist({ email, role }) {
  const row = { email: email.toLowerCase().trim(), role, created_at: new Date().toISOString() };
  const redis = await upstash(["SADD", "liisn:waitlist", JSON.stringify(row)]);
  if (!redis) {
    await fs.mkdir(path.dirname(LOCAL), { recursive: true });
    const rows = await readLocal();
    if (!rows.some((r) => r.email === row.email)) {
      rows.push(row);
      await fs.writeFile(LOCAL, JSON.stringify(rows, null, 2));
    }
  }
  const hook = process.env.WAITLIST_NOTIFY_WEBHOOK;
  if (hook) {
    try {
      await fetch(hook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(row) });
    } catch {}
  }
  return row;
}
