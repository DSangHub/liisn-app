# Liisn screen map

Buyer-first PWA. Seller membership is the only paid surface in v1.

Marketing waitlist -> POST /api/waitlist
Seller checkout -> POST /api/checkout { plan: limited | unlimited }
Stripe webhook -> POST /api/webhook

Logged-in later: /app/scan, /app/ticket/new, /seller/tickets

Rules: no public review feed; ticket needs purchase; direct only if org.plan is limited or unlimited.
