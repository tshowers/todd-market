import { ShippingRate, TunedBrand } from './merchant.model';

export interface PublicStore {
  id: string;
  slug: string;
  name: string;
  isSample: boolean;
  brand: { logoUrl: string | null; tuned: TunedBrand | null };
  heroLine: string;
  quickTiles: { label: string; query: string }[];
  collections: { id: string; name: string; productCount: number }[];
  productCount: number;
  returns: { windowDays: number; shopperPaysShipping: boolean; finalSaleCategories: string[]; requireTags: boolean } | null;
  shipping: ShippingRate[];
  freeShippingOverCents: number | null;
  location: string;
}

export interface Variant { id: string; title: string; priceCents: number | null; available: boolean; options: Record<string, string> }

export interface PublicProduct {
  id: string;
  storeId: string;
  storeName: string;
  storeSlug: string;
  handle: string;
  title: string;
  description: string;
  priceCents: number;
  image: string | null;
  images: string[];
  available: boolean;
  variants: Variant[];
}

export interface NetworkStore {
  id: string;
  name: string;
  slug: string;
  location: string;
  ratePct: number;
  trust: string;
  tuned: TunedBrand | null;
}

export interface Look {
  id: string;
  title: string;
  items: PublicProduct[];
  totalCents: number;
  why: string;
  tradeOff: string;
  betterAt: string;
  givesUp: string;
  referral?: { what: string; store: NetworkStore; item: PublicProduct; totalWithCents: number };
}

export interface SearchResult {
  query: string;
  heading: string;
  note: string;
  looks: Look[];
  referral: { kind: 'whole'; store: NetworkStore; heading: string; items: PublicProduct[] } | null;
  productCount: number;
  ms: number;
}

export interface BagItem {
  key: string;
  storeId: string;
  storeName: string;
  storeSlug: string;
  productId: string;
  variantId: string | null;
  variantTitle: string;
  title: string;
  priceCents: number;
  image: string | null;
  quantity: number;
  /** Set when a store in the network sent the shopper here (variant C). */
  referralId: string | null;
  referredByStoreId: string | null;
}
