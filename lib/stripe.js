import Stripe from "stripe";

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  return new Stripe(key, { apiVersion: "2024-06-20" });
}

export const PLANS = {
  limited: { id: "limited", name: "Limited direct", amountLabel: "$19.95 / year", priceEnv: "STRIPE_PRICE_LIMITED" },
  unlimited: { id: "unlimited", name: "Unlimited direct", amountLabel: "$49.95 / year", priceEnv: "STRIPE_PRICE_UNLIMITED" },
};

export function priceIdFor(plan) {
  const meta = PLANS[plan];
  if (!meta) return null;
  return process.env[meta.priceEnv] || null;
}
