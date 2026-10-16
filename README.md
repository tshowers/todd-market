# TODD Market (web)

Independent stores import a catalog, AI builds a Find-themed storefront, and stores refer shoppers to each other for a commission. Design source: `design_handoff_todd_market_2/` (it supersedes `design_handoff_todd_market/`). Backend: `taliferrotech/todd-backend/functions/market/`.

Angular 19, standalone components, built to the Taliferro product standard (`taliferro-ui/PRODUCT-STANDARD.md`). Firebase Hosting site `todd-market` in project `taliferrotech`.

## Code map

| Path | What |
|---|---|
| `src/app/features/landing, about, help, pricing, ios` | Public pages, **prerendered** for SEO (`app.routes.server.ts`) |
| `src/app/features/sign-in` | Apple, Google, or email link + 6-digit code (one TODD identity) |
| `src/app/features/merchant/onboarding/*` | Import → Brand → Build → Review → Get paid → Live |
| `src/app/features/merchant/dashboard, orders, settings` | Referral dashboard (ledger, network map, controls), orders and returns, settings (store, returns, tax, shipping) |
| `src/app/features/storefront` | `/s/:slug`: home, intent search, looks, referral variant C, bag |
| `src/app/features/checkout` | `/s/:slug/checkout` (Stripe Payment Element) and `/order/:id` |
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
npx ng serve --proxy-config proxy.dev.json          # http://localhost:4200/s/bettys-bridal

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

## Decisions that differ from the handoff

- **Checkout:** each store is the merchant of record. One checkout and one card entry, but a separate charge per store, so the copy says "1 checkout" instead of "1 payment". Confirm the wording with Todd.
- **Pricing:** a per-order fee, no monthly plan. The Pricing page, FAQ and `/ios` line were reworded, and the numbers are still marked "Sample numbers".
- **Store addresses:** paths for now (`/s/<slug>`). `<name>.toddmarket.com` subdomains are a later phase.
- **Merchant Orders screen:** there was no design for it, so it's plain and built from the Find tokens.
- **Imports:** Salesforce Commerce and "Upload files" show a "contact us" note for now. Shopify (public catalog) and CSV import work.
- **Exchanges:** an exchange is a refund plus the store emailing the shopper. Return labels are emailed by the store; there's no carrier API yet.
