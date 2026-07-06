# Minimalist Bazaar

A modern e-commerce platform built with Next.js, MongoDB, Mongoose, and Tailwind CSS.

The platform enables sellers to curate products from external online stores, set custom pricing, and publish listings through a streamlined affiliate and dropshipping workflow.

> **Important:** Ensure all integrations comply with each store's terms of service, affiliate agreements, API policies, and local consumer protection laws. Automated purchasing, price modification, and product data usage may be restricted by some retailers.

---

## Core Concept

Minimalist Bazaar acts as a marketplace layer between external retailers and customers.

**Seller Workflow**
1. Connect or select a supported external store
2. Import product information
3. Upload or edit product images, descriptions, and categories
4. Set a custom sale price
5. Publish the listing
6. Monitor orders and delivery updates

**Customer Workflow**
1. Browse products
2. Add items to cart
3. Complete checkout
4. Receive order tracking information
5. View delivery estimates and order status

**Order Fulfillment Workflow**
1. Customer places an order
2. Payment is captured
3. The system creates a fulfillment request
4. The system automatically attempts to buy the product from the source: through the
   supplier's official order API (CJ Dropshipping) or a custom supplier webhook, using
   the customer's shipping details — if no automated integration applies, or the seller
   hasn't connected a purchasing payment method, the item is queued as a manual purchase
   task instead
5. Customer shipping details are transmitted securely
6. Delivery updates are synchronized with the platform

---

## Technology Stack

**Frontend**
- Framework: Next.js 15 (App Router)
- Styling: Tailwind CSS
- State Management: Zustand
- Forms: React Hook Form + Zod
- Authentication: Auth.js (NextAuth v5)

**Backend**
- Next.js API Routes / Server Actions
- Node.js
- MongoDB + Mongoose

**Infrastructure**
- Vercel (frontend deployment)
- MongoDB Atlas
- Cloudinary or AWS S3 (image storage)
- Redis (caching and queues)
- Stripe (payments)

---

## Development Roadmap

### Phase 1 — Foundation ✅
- [x] Initialize Next.js 15 project with TypeScript and Tailwind CSS
- [x] Configure MongoDB and Mongoose with singleton connection
- [x] Implement Auth.js (NextAuth v5) with credentials provider
- [x] Edge-compatible middleware for JWT-based route protection
- [x] User, Product, Order, and AffiliateLink Mongoose models
- [x] Register and login pages with React Hook Form + Zod validation
- [x] Base folder structure (`features/`, `services/`, `actions/`, `types/`)

### Phase 2 — Product Management ✅
- [x] Product CRUD API routes (`GET`, `POST`, `PATCH`, `DELETE`)
- [x] Reset sale price to source price endpoint
- [x] Seller dashboard with sidebar navigation
- [x] Product listing table with status badges
- [x] Create and edit product form (multi-image URLs, pricing, delivery estimate)
- [x] Public storefront grid (`/products`)
- [x] Product detail page (`/products/[id]`)
- [x] Demo access button with auto-seeding (3 sample products)

### Phase 3 — External Store Integration ✅
- [x] Connector architecture (`services/store-connectors/`)
- [x] Generic connector — Open Graph + JSON-LD scraper (works on most e-commerce sites)
- [x] Amazon-aware connector with JSON-LD + OG tag parsing
- [x] `/api/import` endpoint with auth + URL validation
- [x] Import UI (`/dashboard/products/import`) — paste URL → auto-fills product form
- [x] "Import URL" shortcut on products dashboard

### Phase 4 — Checkout and Orders ✅
- [x] Zustand cart store with localStorage persistence + quantity controls
- [x] Cart drawer (slide-out) with add/remove/update on all product pages
- [x] Stripe Checkout (hosted) — PCI-compliant, no card data on our servers
- [x] `/api/checkout` — creates Stripe session with shipping address collection
- [x] `/api/fulfillment/webhook` — Stripe webhook creates Order on payment success
- [x] Order confirmation page (`/checkout/success`) with cart auto-clear
- [x] Customer order history (`/orders`)
- [x] Seller order view in dashboard (`/dashboard/orders`)

#### ⚠️ TODO — Connect Stripe Payment (required before accepting real payments)

1. **Create a Stripe account** at https://dashboard.stripe.com/register
2. **Get your API keys** from Stripe Dashboard → Developers → API keys
3. **Add keys to `.env.local`**:
   ```
   STRIPE_SECRET_KEY=sk_live_...          # or sk_test_... for testing
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
4. **Set up the webhook** in Stripe Dashboard → Developers → Webhooks:
   - Endpoint URL: `https://yourdomain.com/api/fulfillment/webhook`
   - Event to listen for: `checkout.session.completed`
   - Copy the signing secret into `STRIPE_WEBHOOK_SECRET`
5. **Test the flow** using Stripe's test mode keys and card number `4242 4242 4242 4242`

### Phase 5 — Fulfillment ✅
- [x] Extended Order model with tracking fields (number, carrier, URL, shippedAt, deliveredAt)
- [x] Fulfillment service (`services/fulfillment/`) — status transitions with email trigger
- [x] Email notification service (`services/notifications/email.ts`) — nodemailer with console fallback
- [x] `PATCH /api/orders/[id]/fulfill` — seller updates status + adds tracking info (auth-gated)
- [x] Seller dashboard: per-order fulfill button with tracking modal (Mark processing → shipped → delivered)
- [x] Customer order detail page (`/orders/[id]`) — visual progress tracker + tracking info
- [x] Webhook captures customer email for shipping notifications
- [ ] Add `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS` to `.env.local` to enable shipping emails

### Phase 6 — Affiliate System ✅
- [x] `/go/[slug]` redirect route — increments click count, sets 30-day attribution cookie, redirects to product
- [x] Affiliate link CRUD API (`GET /api/affiliate/links`, `POST`, `DELETE /api/affiliate/links/[id]`)
- [x] Auto-slug generation with collision detection (crypto.randomBytes)
- [x] Click tracking on every `/go/[slug]` visit
- [x] Conversion tracking — checkout passes affiliate slug in Stripe metadata; webhook increments conversions on payment
- [x] Analytics & Affiliates dashboard (`/dashboard/analytics`) — stats cards (links, clicks, conversions, rate), per-link table with progress bars
- [x] Create/delete affiliate links per product directly from dashboard
- [x] One-click copy shareable URL button

### Phase 8 — Open Storefront & User Tiers ✅
- [x] Landing page shows all listed products without requiring login
- [x] Guests (not logged in) can browse, add to cart, and complete checkout
- [x] Registered users start with a limit of 5 orders; admin can promote to unlimited
- [x] Admin dashboard → Users page (`/dashboard/users`) — list all users, order counts, promote button
- [x] `PATCH /api/admin/users/[id]/promote` — sets `maxOrders: -1` (unlimited)
- [x] Storefront header is auth-aware: shows "My orders" / "Dashboard" when logged in
- [ ] **Connect Stripe** (see Phase 4 TODO above) before real purchases can complete

### Phase 9 — Product Data Fetching
- [ ] Scheduled product sync — periodically re-fetch source price, availability, and images for all listed products
- [ ] Price change detection — flag or auto-update sale price when source price drifts beyond a configurable threshold
- [ ] Batch import — accept a list of URLs (CSV or text) and import multiple products in a single job
- [ ] Product catalog enrichment — pull additional structured data (specs, variants, category tags) from supported retailers
- [ ] Availability monitoring — mark products as out-of-stock automatically when source listing is removed or sold out
- [ ] Headless browser fallback — use Playwright/Puppeteer for retailers that block plain HTTP scraping
- [ ] Proxy + rate-limit layer — respect `robots.txt` and each store's crawl policies

### Phase 10 — Dropshipping API
- [x] Supplier connector architecture (`services/dropshipping/`) — pluggable providers, same pattern as `store-connectors/`
- [x] CJ Dropshipping connector — real order-placement API (`createOrder`), gated behind `CJ_DROPSHIPPING_EMAIL` / `CJ_DROPSHIPPING_API_KEY`
- [x] Custom supplier webhook connector — hand off order + shipping address to a seller's own supplier/agent system (`SUPPLIER_WEBHOOK_URL`)
- [x] Automated order routing — on payment success, the Stripe webhook calls `routeSupplierOrder()` for every item
- [x] Manual fulfillment fallback — any source without a working automated integration (Amazon, scraped stores, unconfigured providers, or a failed attempt) is marked `manual_required` with a "Buy from source" link and copyable shipping info in the seller dashboard
- [x] Per-item supplier status tracking (`pending` / `placed` / `manual_required` / `failed`) + seller-triggered retry (`POST /api/orders/:id/supplier-retry`)
- [ ] Real-time inventory sync — pull stock levels from supplier and surface low-inventory warnings in dashboard
- [ ] Variant support — size/color/option selection on product pages, mapped to supplier SKUs (auto-order currently uses the product's default/first variant)
- [ ] Return and refund workflow — initiate supplier-side returns, update order status, trigger refund via Stripe
- [ ] Profit margin calculator — display source cost vs. sale price margin in the product editor
- [ ] Supplier management page — add/remove suppliers, set priority, view per-supplier order stats

> **Why no Amazon/Walmart/eBay/AliExpress-via-scraping auto-buy?** Automatically placing
> a purchase through a retailer's own consumer checkout would mean scripting past login,
> payment forms, and CAPTCHA/2FA — something that isn't reliable to build and violates
> those retailers' terms of service against automated buying bots. Legitimate dropshipping
> automation goes through a supplier's official order-placement API (like CJ Dropshipping)
> or a webhook to a human/agent-run fulfillment system — which is what's implemented above.
> Everything else automatically falls back to the manual task queue.

#### ⚠️ TODO — Connect Purchasing Card (required before automated supplier orders can run)

Automated supplier ordering is gated per-seller behind `User.purchasing.cardConnected` —
until a seller connects a real payment method, every item for that seller falls back to
`manual_required` even if a supplier integration is configured. This is a deliberate
safety switch so the system never places live purchases before a seller has explicitly
opted in. The gate and data model exist (`models/User.ts` → `purchasing`); the connection
flow itself is intentionally left for later:

1. **Create a Stripe SetupIntent** server-side (`stripe.setupIntents.create()`) for the
   seller and render Stripe Elements' card form on a new `/dashboard/settings/purchasing`
   page — this tokenizes the card with Stripe directly, so raw card numbers never touch
   our server (same PCI-scope reasoning as the Phase 4 checkout).
2. **On confirmation**, store only the token references on the seller's `User` doc:
   `purchasing.stripeCustomerId`, `purchasing.stripePaymentMethodId`, `purchasing.last4`,
   `purchasing.brand` — then set `purchasing.cardConnected = true`.
3. **Decide the charge model**: CJ Dropshipping deducts from a prepaid CJ account balance
   (top up directly on CJ, no per-order card charge from us), while a custom supplier
   webhook may expect us to charge the seller's card per order via
   `stripe.paymentIntents.create({ customer, payment_method, off_session: true })` before
   calling the webhook — implement whichever matches the supplier relationship.
4. **Add a "Disconnect card"** action that detaches the Stripe payment method and resets
   `cardConnected` to `false`, immediately pausing automated ordering for that seller.
5. **Test with Stripe test mode** (`4242 4242 4242 4242`) before connecting a real card.

### Phase 7 — Launch ✅
- [x] Security headers via `next.config.ts` (CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy, `poweredByHeader: false`)
- [x] Global SEO metadata with title template, Open Graph, and Twitter Card tags
- [x] Dynamic `generateMetadata` on product detail pages (title, description, OG image)
- [x] `sitemap.xml` — static routes + all live product pages
- [x] `robots.txt` — crawlable public pages, blocked dashboard/api/checkout
- [x] Custom 404 page (`app/not-found.tsx`) with navigation links
- [x] Global error boundary (`app/error.tsx`) with retry button
- [x] Loading skeletons for dashboard, products, and orders routes
- [x] Dashboard overview enriched with revenue, pending orders, affiliate stats, and recent orders table
- [ ] Security review
- [ ] Compliance review (GDPR, CCPA)
- [ ] Production deployment to Vercel + MongoDB Atlas

---

## Key Features

**Product Import System** — Import products from supported retailers, retrieving title, description, images, original price, availability, and delivery estimates.

**Product Listing Management** — Edit descriptions, upload custom images, set custom pricing, toggle listing status, reset pricing to source, and manage listings in bulk.

**Affiliate Marketing** — Associate products with affiliate links, track clicks and conversions, display commission analytics, and generate shareable URLs.

**Dropshipping** — Automatically route paid orders to a supplier's order-placement API (CJ Dropshipping) or a custom supplier webhook, transmit customer shipping info securely, fall back to a manual purchase task when no automated path applies, and track fulfillment status and delivery estimates.

**Customer Experience** — Product search and filtering, shopping cart, secure checkout, order history, shipment tracking, and email notifications.

**Admin Dashboard** — User management, seller approvals, product moderation, order monitoring, revenue analytics, and affiliate performance metrics.

---

## Database Models

```ts
User {
  name: string
  email: string
  role: "customer" | "seller" | "admin"
  purchasing: {
    cardConnected: boolean       // gates automated supplier ordering — see Phase 10 TODO
    stripeCustomerId?: string
    stripePaymentMethodId?: string
    last4?: string
    brand?: string
  }
}

Product {
  title: string
  description: string
  images: string[]
  sourceStore: string
  sourceUrl: string
  sourcePrice: number
  salePrice: number
  deliveryEstimate: string
  status: "draft" | "listed" | "disabled"
}

Order {
  customerId: ObjectId
  items: OrderItem[]           // each item snapshots sourceUrl/sourceStore + supplierStatus
  totalAmount: number
  paymentStatus: string
  fulfillmentStatus: string
  shippingAddress: Address
}

OrderItem {
  productId: ObjectId
  title: string
  quantity: number
  price: number
  sourceUrl?: string
  sourceStore?: string
  supplierStatus?: "pending" | "placed" | "manual_required" | "failed"
  supplierOrderId?: string
  supplierNote?: string
}

AffiliateLink {
  productId: ObjectId
  sellerId: ObjectId
  clicks: number
  conversions: number
}
```

---

## Folder Structure

```
minimalist-bazaar/
├── app/
│   ├── (auth)/login/
│   ├── (auth)/register/
│   ├── api/auth/
│   ├── api/products/
│   ├── api/seed/
│   ├── dashboard/
│   └── products/
├── components/
│   ├── dashboard/
│   ├── products/
│   └── ui/
├── features/
│   ├── auth/
│   ├── products/
│   ├── orders/
│   ├── affiliates/
│   └── fulfillment/
├── lib/
│   ├── mongodb.ts
│   ├── auth.ts
│   └── payments.ts
├── models/
├── services/
│   ├── store-connectors/
│   ├── dropshipping/
│   ├── fulfillment/
│   └── notifications/
├── actions/
├── types/
├── auth.ts
├── auth.config.ts
└── middleware.ts
```

---

## API Reference

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/[...nextauth]` | Auth.js sign-in/sign-out |
| GET | `/api/products` | List products |
| POST | `/api/products` | Create a product |
| GET | `/api/products/:id` | Get a product |
| PATCH | `/api/products/:id` | Update a product |
| DELETE | `/api/products/:id` | Delete a product |
| POST | `/api/products/:id/reset-price` | Reset sale price to source price |
| POST | `/api/orders/:id/supplier-retry` | Re-attempt automated supplier ordering for an order's items (seller-only) |
| POST | `/api/seed` | Seed demo user and products (dev only) |

---

## Getting Started

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Fill in MONGODB_URI and AUTH_SECRET

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and click **Try demo** for instant access with pre-seeded products.

---

## Legal and Compliance

**Required checks before any retailer integration:**
- Verify retailer API availability
- Confirm automated purchasing is permitted
- Confirm product image usage rights
- Validate affiliate program rules
- Review regional consumer protection laws

**Privacy:** Store only necessary customer data (name, shipping address, email). Comply with GDPR, CCPA, and applicable local regulations.

---

## Future Enhancements

- AI-generated product descriptions
- Dynamic pricing recommendations
- Multi-currency support
- Multi-language support
- Seller reputation system
- Mobile application
- Inventory forecasting

---

## Success Metrics

- Number of active sellers
- Conversion rate
- Average order value
- Affiliate revenue
- Fulfillment success rate
- Customer satisfaction score
- Average delivery time
- Return rate
