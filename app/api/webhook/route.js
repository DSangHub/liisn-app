import { NextResponse } from "next/server";
import { getStripe } from "../../../lib/stripe";

export const runtime = "nodejs";

export async function POST(req) {
  const stripe = getStripe();
  const sig = req.headers.get("stripe-signature");
  const raw = await req.text();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!sig || !secret) {
    return NextResponse.json({ error: "Webhook not configured" }, { status: 400 });
  }
  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig, secret);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    console.log("liisn membership", {
      email: session.customer_details?.email,
      plan: session.metadata?.plan,
      customer: session.customer,
      subscription: session.subscription,
    });
  }
  return NextResponse.json({ received: true });
}
