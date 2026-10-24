export type OnboardingStep = 'import' | 'brand' | 'build' | 'review' | 'get-paid' | 'live';
export type Voice = 'warm' | 'classic' | 'minimal';

export interface Palette { main: string; accent: string; background: string }

export interface TunedBrand {
  accent: string;
  tintLight: string;
  tintDark: string;
  tintFgLight: string;
  tintFgDark: string;
  accentShiftPct: number;
  notes: string[];
}

export interface StoreBrand { palette: Palette; tuned: TunedBrand; logoUrl: string | null }

export interface MerchantStore {
  id: string;
  name: string;
  slug: string;
  status: 'draft' | 'live';
  source: string;
  onboardingStep: OnboardingStep;
  voice: Voice;
  heroLines: Partial<Record<Voice, string>>;
  quickTiles: { label: string; query: string }[];
  brand: StoreBrand;
  referral: {
    offeredRatePct: number;
    minCommissionPct: number;
    blockedCategories: string[];
    blockedStoreIds: string[];
    acceptFrom: 'any' | 'approved';
    approvedStoreIds: string[];
    networkSearch?: boolean;
    /** In-store search, when no network store has it: shops from the Find crawl. On unless false. */
    webListings?: boolean;
  };
  directoryCategory: string;
  customDomain: CustomDomain | null;
  /** Set when the store began as a claimed listing from the Find crawl. */
  claimedListing: { domain: string; interestCount: number } | null;
  /** Return labels: Shippo switched on for TODD (available), and connected by this store. */
  shippo?: { available: boolean; connected: boolean };
  settings: StoreSettings;
  stats: { productCount: number; photoCount: number; collectionCount: number; networkCount: number };
  stripe: { connected: boolean; chargesEnabled: boolean; payoutsEnabled: boolean; bankLast4: string | null; taxStatus: string | null; detailsSubmitted?: boolean; needsMore?: boolean };
}

export interface CustomDomain { name: string; status: 'pending' | 'active'; records: { type: string; name: string; value: string }[]; checkedAt: number }

export interface ShippingRate { id: string; label: string; detail: string; priceCents: number; minDays: number; maxDays: number }

export interface StoreSettings {
  store: { email: string; phone: string; location: string; pickup: boolean; address?: { line1: string; city: string; state: string; postal_code: string } | null };
  returns: { windowDays: number; shopperPaysShipping: boolean; returnShippingCents: number; finalSaleCategories: string[]; requireTags: boolean; parcel?: Parcel | null };
  tax: { auto: boolean; pricesIncludeTax: boolean };
  shipping: { rates: ShippingRate[]; freeOverCents: number | null };
  /** The store home page below the search; missing until the owner changes it. */
  home?: HomeSettings;
}

export interface HomeSettings {
  /** Up to 4; empty means suggested from the catalog each week. */
  exampleSearches: string[];
  section: 'new' | 'gifts' | 'collection' | 'off';
  sectionCollectionId: string | null;
  /** collectionId → productId whose photo the category tile shows. */
  categoryImages: Record<string, string>;
}

/** A supplier spec sheet read by the server (Settings → Products). */
export interface SheetPreview {
  sourceId: string; title: string; sku: string; productType: string; costCents: number; priceCents: number;
  available: boolean; priceDate: string; hasPhoto: boolean;
  /** The store already has this part number: adding updates its price and stock. */
  exists: boolean;
}

export interface HomeOptions {
  collections: { id: string; name: string; products: { id: string; title: string; image: string }[] }[];
  automaticSearches: string[];
}

export interface BuildStep { label: string; detail: string; state: 'pending' | 'active' | 'done' | 'failed' }
export interface BuildJob { id: string; status: 'queued' | 'running' | 'done' | 'failed'; steps: BuildStep[]; error: string | null }

export interface ReviewData {
  store: MerchantStore;
  collections: { id: string; name: string; productCount: number; enabled: boolean }[];
  issues: { id: string; kind: string; message: string; actionLabel: string; resolved: boolean }[];
}

export const ONBOARDING_STEPS: { key: OnboardingStep; label: string }[] = [
  { key: 'import', label: 'Import' },
  { key: 'brand', label: 'Brand' },
  { key: 'build', label: 'Build' },
  { key: 'review', label: 'Review' },
  { key: 'get-paid', label: 'Get paid' },
  { key: 'live', label: 'Live' },
];

export interface Parcel { lengthIn: number; widthIn: number; heightIn: number; weightOz: number }
