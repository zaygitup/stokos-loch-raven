# Stokos Client Onboarding (Minimal Touchpoints)

Stokos pays development cost + monthly maintenance. They do **not** need Vercel, Clerk, MongoDB, or Stripe Dashboard access for day-to-day operations.

---

## What Stokos must do (one time)

### 1. Stripe bank connection (~10 minutes)

Abassi sends a **Stripe Express onboarding link**. Stokos owner:

1. Opens the link
2. Confirms business details
3. Adds **bank account** for payouts
4. Completes identity verification if prompted

Abassi confirms `charges_enabled` and `payouts_enabled` before go-live.

### 2. Staff emails

Send manager email addresses to **Azan** for admin accounts:

- Towson location manager
- York location manager
- Liberty location manager
- Any supervisors

Azan creates Clerk accounts — staff use **Staff Login** in the site footer.

### 3. Domain (optional)

Purchase domain (e.g. `stokos.com`) and delegate DNS to Azan for Vercel + Clerk.

---

## Handoff call (~30 minutes)

Azan walks staff through:

1. **Staff Login** (footer on any page)
2. Sign in with provided credentials
3. Select **branch** in admin sidebar
4. View **Orders** queue — new orders, payment status
5. **Advance order status** (Preparing → Ready → Completed)
6. **Cancel** flow — unpaid vs paid (paid refunds handled by Abassi until automated)

---

## What Stokos does NOT need

- Vercel dashboard
- Clerk dashboard
- MongoDB Atlas
- Stripe dashboard (optional Express dashboard for payout visibility)

---

## After launch

- **Azan:** app updates, staff account changes, client support coordination
- **Abassi:** database health, Stripe/Connect, webhooks, manual refunds if needed
- **48-hour monitor:** first two days after go-live for order/payment issues
