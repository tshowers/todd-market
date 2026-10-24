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

/** A product as a card on the store home page (no reviews yet: rating stays null). */
export interface ProductCard { id: string; title: string; priceCents: number; image: string | null; available: boolean; rating: number | null; reviewCount: number }

/** Everything below the search on the store home page (GET /storefront/:slug/home). */
export interface StoreHome {
  searchPlaceholder: string;
  exampleSearches: string[];
  categories: { id: string; name: string; count: number; image: string | null }[];
  moreCategories: boolean;
  bestSellers: { title: string; products: ProductCard[] };
  section: { type: 'new' | 'gifts' | 'collection'; title: string; collectionId: string | null; products: ProductCard[] } | null;
  trust: { freeShippingOverCents?: number; returnsDays?: number; location?: string; rating?: number; reviewCount?: number };
  contactEmail: string | null;
}

export interface StoreWithHome extends PublicStore { home: StoreHome }

/** "All products", a category, or "See all". */
export interface BrowseResult { title: string; products: ProductCard[] }

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

/** A product from a shop in the Find crawl that isn't on TODD Market: links out, nothing to buy here. */
export interface ListingItem { id: string; title: string; image: string; url: string; storeName: string; storeDomain: string; storeUrl: string; category: string; priceCents?: number | null }

export interface SearchResult {
  query: string;
  heading: string;
  note: string;
  looks: Look[];
  referral: { kind: 'whole'; store: NetworkStore; heading: string; items: PublicProduct[] } | null;
  /** No store in the network has it: shops from the Find crawl, linking out. Never alongside a referral. */
  listingItems?: ListingItem[];
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
