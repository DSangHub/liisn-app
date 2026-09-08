# Liisn data model

Entities: waitlist_entry, user, org, purchase, ticket, message, membership_event.

org.plan = free | limited | unlimited
ticket.channel = mediated | direct
ticket.type = complaint | compliment | question
purchase required on every ticket.
Limited plan yearly direct-chat cap default 24.
Stripe IDs only — no PAN.
