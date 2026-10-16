/** The demo store behind "See a sample store" (seeded by functions/market/scripts/seedSampleStore.js). */
export const SAMPLE_STORE_SLUG = 'bettys-bridal';
export const SAMPLE_STORE_PATH = `/s/${ SAMPLE_STORE_SLUG }`;

/**
 * TODD Market's fee on each order, as a percentage of the merchandise
 * subtotal. Shown on Pricing; the backend charges what's in
 * Firestore config/market.platformFeeBps, so change both together.
 * Sample value: the handoff's numbers are "replace before launch".
 */
export const PLATFORM_FEE_PCT = 3;

/** Referral commission range a store can offer (dashboard Controls: 0–20). */
export const REFERRAL_RATE_RANGE = { min: 5, max: 20 };

/**
 * The TODD Market iPhone app's App Store page. Empty until the app ships:
 * /ios then shows "Coming soon" instead of a badge that links nowhere.
 */
export const IOS_APP_STORE_URL = '';
