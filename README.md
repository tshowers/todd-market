# TODD Market (web)

Independent stores import a catalog, AI builds a Find-themed storefront, and stores refer shoppers to each other for a commission. Design source: `design_handoff_todd_market_2/` (it supersedes `design_handoff_todd_market/`). Backend: `taliferrotech/todd-backend/functions/market/`.

Angular 19, standalone components, built to the Taliferro product standard (`taliferro-ui/PRODUCT-STANDARD.md`). Firebase Hosting site `todd-market` in project `taliferrotech`.

## Code map

| Path | What |
|---|---|
| `src/app/features/root`, `features/shop` | `/`: the shopper home. Search all stores, toggled with the Store directory (design Part 3). On a store's own domain, `/` shows that store |
| `src/app/features/landing, about, help, pricing, ios` | Merchant landing at `/sell`, plus About, Help, Pricing, iOS. `/` and these are **prerendered** for SEO (`app.routes.server.ts`) |
| `src/app/features/sign-in` | Apple, Google, or email link + 6-digit code (one TODD identity) |
| `src/app/features/merchant/onboarding/*` | Import → Brand → Build → Review → Get paid → Live |
| `src/app/features/merchant/dashboard, orders, settings` | Referral dashboard (ledger, network map, controls), orders and returns, settings (store, returns, tax, shipping) |
| `src/app/features/storefront` | `/:slug` (old `/s/:slug` links redirect): home, intent search, looks, referral variant C, bag |
| `src/app/features/checkout` | `/:slug/checkout` (Stripe Payment Element) and `/order/:id` |
| `src/app/features/account` | `/account`: orders, order detail, 4-step return, saved, addresses, payment methods |
| `src/app/shared/brand/brand-tuning.ts` | WCAG colour tuning. Twin of the backend's `brandTuning.js`; both are tested against the same fixtures |
| `src/app/shared/return-policy.ts` | The policy sentence. Twin of the backend's `policy.js` |
| `src/app/models/market.constants.ts` | `PLATFORM_FEE_PCT` (must match Firestore `config/market.platformFeeBps`), sample store, `IOS_APP_STORE_URL` |
| `public/assets/video/` | How it works: light and dark cuts plus posters (the player follows the theme) |

The universal menu, footer and sounds are synced from `taliferro-ui`. Don't edit the copies; edit the templates and run their `sync.sh`.

## Run it locally

The local API runs without Java, cloud credentials or paid AI calls. It uses an in-memory Firestore, a fake Stripe and AI turned off.

```sh
# 1. API with sample stores (Betty's Bridal, Cameron's Dress Shoes) on :5055
cd ../../taliferrotech/todd-backend/functions && node market/dev/server.js

# 2a. Public pages and storefront
npx ng serve --proxy-config proxy.dev.json          # http://localhost:4200 and /bettys-bridal

# 2b. Merchant and account screens, signed in as "merchant1" (dev-only build)
npx ng serve --configuration devauth --proxy-config proxy.dev.json
```

`environment.devauth.ts` is used only by the `devauth` configuration. Production builds have `devAuthUid: ''`.

## Configuration

- `src/environments/environment.prod.ts`: set `stripePublishableKey` (platform account). Until it's set, checkout shows "Card payments are not set up".
- `models/market.constants.ts`: `PLATFORM_FEE_PCT` (sample 3%) and `IOS_APP_STORE_URL` (empty means "Coming soon").
- Firebase Auth (project `taliferrotech`): enable **Apple** and **Google** sign-in, and add `market.taliferro.tech` to the authorized domains.
- Stripe: register `market.taliferro.tech` for Apple Pay on the platform account.

## Build, test, deploy

```sh
npm run build        # bumps the version; prerenders /, /about, /help, /pricing, /ios
npm run test:ci      # Karma, ChromeHeadless
./deploy.sh          # build, test, then firebase deploy --only hosting:todd-market
```

The first deploy needs the Hosting site created (`firebase hosting:sites:create todd-market`) and the `market.taliferro.tech` domain connected. `firebase.json` rewrites `/api/**`, `/feeds/**` and `/p/**` to the `marketApi` function, so deploy the backend first.

## End-to-end tests

Two journeys cover a store's whole life: a merchant signs up and imports products, the store is built, gets paid and goes live, a shopper buys, the store ships and delivers, there's an exchange and a return, the referral commission is paid, and the merchant signs out (or deletes the account).

- **API journey (backend):** `npx jest market/__tests__/journey` in `taliferrotech/todd-backend/functions`. It drives the real API with an in-memory Firestore and a fake Stripe, in about a second, and runs with the other backend tests.
- **Browser journey (this repo):** `npm run e2e`. It builds the `e2e` configuration (signed in as `merchant1`, a stand-in Stripe.js from `cypress/fixtures/fake-stripe.txt`), starts `scripts/serve-e2e.mjs` (the dev API from the backend repo on :5055, plus the build on :4311), and runs `cypress/e2e/01-04` in order:
  - onboarding
  - purchase, on desktop and phone
  - fulfillment and an exchange
  - sign out

  `deploy.sh` runs it after the unit tests. The backend repo must sit at `../../taliferrotech/todd-backend/functions`, or set `MARKET_BACKEND_DIR`.
- **Interactive:** `npm run serve:e2e` in one terminal, `npm run cy:open` in another.
- `cy:run` and `cy:open` unset `ELECTRON_RUN_AS_NODE`. VS Code sets it in its terminals, and it stops Cypress's Electron from starting ("bad option: --no-sandbox").

Neither journey touches real Stripe. Before a big payments change, also do one real purchase on a live test store and refund it from its Stripe Dashboard. That checks the parts the fakes can't: 3D Secure, Apple Pay and Google Pay, and real fees and tax.

## Decisions that differ from the handoff

- **Checkout:** each store is the merchant of record. One checkout and one card entry, but a separate charge per store, so the copy says "1 checkout" instead of "1 payment". Confirm the wording with Todd.
- **Pricing:** a per-order fee, no monthly plan. The Pricing page, FAQ and `/ios` line were reworded, and the numbers are still marked "Sample numbers".
- **Store addresses:** `market.taliferro.tech/<slug>`. Named paths are reserved (`RESERVED_SLUGS` in the backend). A store can also connect **its own domain** (Settings → Store): the backend registers it on the `todd-market` Hosting site through the Firebase Hosting API and shows the merchant the DNS records. A Hosting site has a custom-domain limit, so past a few dozen stores this needs a load-balancer front door.
- **Find:** Find's "Shop" tile opens Market, and Find results show a "From local stores on TODD Market" strip, which comes from `/api/network/search` with `lite: true` (no AI call).
- **Merchant Orders screen:** there was no design for it, so it's plain and built from the Find tokens.
- **Imports:** Salesforce Commerce and "Upload files" show a "contact us" note for now. Shopify (public catalog) and CSV import work.
- **Exchanges:** an exchange is a refund plus the store emailing the shopper. Return labels are emailed by the store; there's no carrier API yet.
