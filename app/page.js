"use client";

import { useEffect, useState } from "react";

async function postJson(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

export default function Home() {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [comments, setComments] = useState([]);
  const [geo, setGeo] = useState({ lat: null, lng: null });
  const [cStatus, setCStatus] = useState("");
  const [cBusy, setCBusy] = useState(false);

  useEffect(() => {
    loadComments();
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;
      setGeo({ lat, lng });
      loadComments(lat, lng);
    }, () => {});
  }, []);

  async function loadComments(lat, lng) {
    const q = lat != null && lng != null ? `?lat=${lat}&lng=${lng}` : "";
    const res = await fetch(`/api/comments${q}`);
    const data = await res.json().catch(() => ({}));
    setComments(data.comments || []);
  }

  async function onComment(e) {
    e.preventDefault();
    setCBusy(true);
    setCStatus("");
    const fd = new FormData(e.target);
    try {
      const data = await postJson("/api/comments", {
        business_name: fd.get("business_name"),
        body: fd.get("body"),
        lat: geo.lat,
        lng: geo.lng,
      });
      setComments((rows) => [data.comment, ...rows]);
      setCStatus(data.comment.match ? `Posted. AI matched ${data.comment.match.display} for a possible reply.` : "Posted.");
      e.target.reset();
    } catch (err) {
      setCStatus(err.message);
    } finally {
      setCBusy(false);
    }
  }

  async function onWaitlist(e) {
    e.preventDefault();
    setBusy(true);
    setStatus("");
    const fd = new FormData(e.target);
    try {
      await postJson("/api/waitlist", { email: fd.get("email"), role: fd.get("role") });
      setStatus("You are on the list.");
      e.target.reset();
    } catch (err) {
      setStatus(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function checkout(plan) {
    setBusy(true);
    setStatus("");
    try {
      const data = await postJson("/api/checkout", { plan });
      window.location.href = data.url;
    } catch (err) {
      setStatus(err.message);
      setBusy(false);
    }
  }

  return (
    <>
      <style>{css}</style>
      <header>
        <div className="wrap nav">
          <a className="brand" href="#top"><b>liisn</b></a>
          <a className="btn btn-signal" href="#listen">Comment nearby</a>
        </div>
      </header>
      <main id="top">
        <div className="wrap hero">
          <div>
            <p className="kicker">no signup</p>
            <h1>Listen to us.<br />We buy your products.</h1>
            <p className="lede">Name the business, drop a comment, keep your location. AI detects the brand so they can answer.</p>
          </div>
        </div>
        <section id="listen" className="wrap listen">
          <div>
            <h2>Say it where you are.</h2>
            <form className="cform" onSubmit={onComment}>
              <input required name="business_name" placeholder="Business or product name" maxLength={80} />
              <textarea required name="body" placeholder="Complaint, compliment, or question" maxLength={500} rows={4} />
              <button className="btn btn-ink" disabled={cBusy} type="submit">Post comment</button>
            </form>
            <p className="note">{geo.lat != null ? `Approx ${geo.lat.toFixed(3)}, ${geo.lng.toFixed(3)}` : "Location off — comment still posts."}</p>
            {cStatus ? <p className="note">{cStatus}</p> : null}
          </div>
          <div className="column">
            <div className="num">Comments</div>
            {comments.map((c) => (
              <article key={c.id} className="citem">
                <header><strong>{c.business_name}</strong>{c.match ? <span className="tag">AI: {c.match.display}</span> : null}</header>
                <p>{c.body}</p>
                <footer>{c.place_label || (c.lat != null ? `${c.lat}, ${c.lng}` : "no geo")}{c.km != null ? ` · ${c.km.toFixed(1)} km` : ""}</footer>
              </article>
            ))}
          </div>
        </section>
        <section id="pricing" className="wrap">
          <h2>Seller membership</h2>
          <div className="plans">
            <div className="plan"><div className="price">$19.95</div><button className="btn btn-ghost" disabled={busy} onClick={() => checkout("limited")}>Limited</button></div>
            <div className="plan feat"><div className="price">$49.95</div><button className="btn btn-signal" disabled={busy} onClick={() => checkout("unlimited")}>Unlimited</button></div>
          </div>
        </section>
        <section id="waitlist" className="wrap dark">
          <h2>Waitlist</h2>
          <form onSubmit={onWaitlist}>
            <input required type="email" name="email" placeholder="you@email.com" />
            <select name="role" defaultValue="buyer">
              <option value="buyer">I buy</option>
              <option value="seller">I sell</option>
              <option value="both">Both</option>
            </select>
            <button className="btn btn-signal" disabled={busy} type="submit">Request access</button>
          </form>
          {status ? <p className="note">{status}</p> : null}
        </section>
      </main>
    </>
  );
}

const css = `body{font-family:Georgia,serif;background:#F6F1E8;color:#0B1220;margin:0}.wrap{width:min(1100px,calc(100% - 40px));margin:0 auto}.nav{display:flex;justify-content:space-between;align-items:center;padding:14px 0}.btn{border-radius:999px;padding:11px 16px;font:600 .9rem system-ui;border:0;cursor:pointer}.btn-signal{background:#E85D04;color:#fff}.btn-ink{background:#0B1220;color:#F6F1E8}.btn-ghost{border:1px solid rgba(11,18,32,.12);background:transparent}.hero{padding:48px 0 16px}h1{font-size:clamp(2.2rem,5vw,3.4rem);line-height:1.05}.kicker{letter-spacing:.16em;text-transform:uppercase;font:700 .72rem system-ui;color:#E85D04}.listen{display:grid;grid-template-columns:1fr 1fr;gap:24px}.cform{display:flex;flex-direction:column;gap:10px}input,textarea,select{padding:12px 14px;border-radius:12px;border:1px solid rgba(11,18,32,.12);font:1rem system-ui}.column{background:#fff;border:1px solid rgba(11,18,32,.12);border-radius:16px;padding:16px;max-height:480px;overflow:auto}.citem{border-top:1px solid rgba(11,18,32,.12);padding:12px 0}.citem header{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.tag{font:.7rem system-ui;background:#0B1220;color:#F6F1E8;border-radius:999px;padding:3px 8px}.citem footer,.note{font:.8rem system-ui;color:#5C6573}.plans{display:grid;grid-template-columns:1fr 1fr;gap:14px}.plan{background:#fff;border-radius:16px;padding:20px;border:1px solid rgba(11,18,32,.12)}.plan.feat{background:#0B1220;color:#F6F1E8}.price{font-size:2rem}.dark{background:#0B1220;color:#F6F1E8;border-radius:24px;padding:36px;margin:40px auto 64px;text-align:center}form{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}@media(max-width:800px){.listen,.plans{grid-template-columns:1fr}}`;
