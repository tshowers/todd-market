import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, inject } from '@angular/core';

import { PublicProduct } from '../models/storefront.model';
import { MarketApiService } from './market-api.service';

export interface DirectoryStore {
  id: string; slug: string; name: string; category: string; city: string; location: string; description: string;
  logoUrl: string | null; tint: string | null; tintFg: string | null; tintDark: string | null; tintFgDark: string | null;
  features: string[]; isNew: boolean; isSample: boolean; customDomain: string | null;
}
export interface NetworkItem extends PublicProduct {
  storeTint: string | null; storeTintFg: string | null; storeLogoUrl: string | null; isSample: boolean; reason: string; fulfilment: string;
}
/** A shop from the Find crawl that isn't on TODD Market: links out, nothing to buy here. */
export interface Listing {
  domain: string; name: string; url: string; category: string; region: string; city: string;
  products: { title: string; url: string; imageUrl: string; description: string }[];
}
export interface ListingItem { id: string; title: string; image: string; url: string; storeName: string; storeDomain: string; storeUrl: string; category: string }
export interface NetworkResult {
  query: string; bestId: string | null; note: string; items: NetworkItem[]; listingItems?: ListingItem[];
  stores: ( DirectoryStore & { matches: number } )[]; storesSearched: number; ms: number;
}

/** Hosts that are TODD Market itself; any other host is a store's own domain. */
const MARKET_HOSTS = /^(market\.taliferro\.tech|todd-market\.web\.app|todd-market\.firebaseapp\.com|localhost|127\.0\.0\.1)$/;

/** Shop stores, Search all stores, and stores on their own domains. */
@Injectable( { providedIn: 'root' } )
export class ShopService {
  private readonly api = inject( MarketApiService );
  private readonly isBrowser = isPlatformBrowser( inject( PLATFORM_ID ) );
  private hostStore: Promise<{ slug: string; name: string } | null> | null = null;

  stores (): Promise<{ stores: DirectoryStore[]; listings: Listing[]; categories: string[] }> {
    return this.api.get( '/stores' );
  }

  search ( query: string, storeIds?: string[] ): Promise<NetworkResult> {
    return this.api.post( '/network/search', { query, storeIds } );
  }

  /** On a store's own domain (shop.amysshoes.com), that store; otherwise null. */
  storeForThisHost (): Promise<{ slug: string; name: string } | null> {
    if ( !this.isBrowser || MARKET_HOSTS.test( location.hostname ) ) return Promise.resolve( null );
    this.hostStore ||= this.api.get<{ store: { slug: string; name: string } | null }>( '/storefront/by-domain', { host: location.hostname } )
      .then( ( r ) => r.store ).catch( () => null );
    return this.hostStore;
  }
}
