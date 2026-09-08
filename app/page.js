"use client";

import { useState } from "react";

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
          <a className="btn btn-signal" href="#waitlist">Get early access</a>
        </div>
      </header>
      <main id="top">
        <div className="wrap hero">
          <div>
            <p className="kicker">liisn.app</p>
            <h1>Listen to us.<br />We buy your products.</h1>
            <p className="lede">Scan the receipt. Message the maker. Get an answer back.</p>
            <a className="btn btn-ink" href="#waitlist">Join the buyer list</a>
          </div>
        </div>
        <section id="pricing" className="wrap">
          <h2>Annual membership</h2>
          <div className="plans">
            <div className="plan"><div className="num">Buyers</div><div className="price">$0</div><a className="btn btn-ghost" href="#waitlist">Join list</a></div>
            <div className="plan"><div className="num">Limited</div><div className="price">$19.95</div><button className="btn btn-ghost" disabled={busy} onClick={() => checkout("limited")}>Checkout</button></div>
            <div className="plan feat"><div className="num">Unlimited</div><div className="price">$49.95</div><button className="btn btn-signal" disabled={busy} onClick={() => checkout("unlimited")}>Checkout</button></div>
          </div>
        </section>
        <section id="waitlist" className="wrap dark">
          <h2>Be first on liisn.app</h2>
          <form onSubmit={onWaitlist}>
            <input required type="email" name="email" placeholder="you@email.com" />
            <select name="role" defaultValue="buyer">
              <option value="buyer">I buy products</option>
              <option value="seller">I sell / manufacture</option>
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

const css = `body{font-family:Georgia,serif;background:#F6F1E8;color:#0B1220;margin:0}.wrap{width:min(1100px,calc(100% - 40px));margin:0 auto}header{padding:14px 0}.nav{display:flex;justify-content:space-between;align-items:center}.btn{border-radius:999px;padding:11px 16px;font:600 .9rem system-ui;border:0;cursor:pointer;text-decoration:none}.btn-signal{background:#E85D04;color:#fff}.btn-ink{background:#0B1220;color:#F6F1E8}.btn-ghost{border:1px solid rgba(11,18,32,.12);background:transparent}.hero{padding:64px 0}h1{font-size:clamp(2.2rem,5vw,3.6rem);line-height:1.05}.kicker{letter-spacing:.16em;text-transform:uppercase;font:700 .72rem system-ui;color:#E85D04}.plans{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px}.plan{background:#fff;border:1px solid rgba(11,18,32,.12);border-radius:16px;padding:20px}.plan.feat{background:#0B1220;color:#F6F1E8}.price{font-size:2rem}.dark{background:#0B1220;color:#F6F1E8;border-radius:24px;padding:36px;margin:40px auto 64px;text-align:center}form{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}input,select{padding:12px 16px;border-radius:999px;border:0}`;
