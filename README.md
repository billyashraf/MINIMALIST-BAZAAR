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
4. The product is purchased from the source retailer or forwarded to an approved fulfillment partner
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

**Dropshipping** — Create fulfillment requests after payment, transmit customer shipping info securely, track fulfillment status, and sync delivery estimates.

**Customer Experience** — Product search and filtering, shopping cart, secure checkout, order history, shipment tracking, and email notifications.

**Admin Dashboard** — User management, seller approvals, product moderation, order monitoring, revenue analytics, and affiliate performance metrics.

---

## Database Models

```ts
User {
  name: string
  email: string
  role: "customer" | "seller" | "admin"
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
  items: OrderItem[]
  totalAmount: number
  paymentStatus: string
  fulfillmentStatus: string
  shippingAddress: Address
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
