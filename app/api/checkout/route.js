import { NextResponse } from "next/server";
import { getStripe, PLANS, priceIdFor } from "../../../lib/stripe";

export async function POST(req) {
  const body = await req.json().catch(() => ({}));
  const plan = body.plan === "limited" ? "limited" : "unlimited";
  const price = priceIdFor(plan);
  if (!price) {
    return NextResponse.json({ error: `Missing ${PLANS[plan].priceEnv} in environment` }, { status: 500 });
  }
  const origin = process.env.NEXT_PUBLIC_SITE_URL || req.headers.get("origin") || "http://localhost:3000";
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price, quantity: 1 }],
    success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/cancel`,
    allow_promotion_codes: true,
    metadata: { plan, product: "liisn-seller" },
    subscription_data: { metadata: { plan, product: "liisn-seller" } },
  });
  return NextResponse.json({ url: session.url });
}
