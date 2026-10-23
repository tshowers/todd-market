import { Injectable, inject } from '@angular/core';

import { BrowseResult, PublicProduct, PublicStore, SearchResult, StoreWithHome } from '../models/storefront.model';
import { MarketApiService } from './market-api.service';

/** The public storefront calls. */
@Injectable( { providedIn: 'root' } )
export class StorefrontService {
  private readonly api = inject( MarketApiService );

  store ( slug: string ): Promise<PublicStore> {
    return this.api.get( `/storefront/${ encodeURIComponent( slug ) }` );
  }

  /** The home page in one request: the store, plus categories, best sellers and the rest. */
  home ( slug: string ): Promise<StoreWithHome> {
    return this.api.get( `/storefront/${ encodeURIComponent( slug ) }/home` );
  }

  browse ( slug: string, opts: { category?: string | null; sort?: 'best' | 'new' } = {} ): Promise<BrowseResult> {
    return this.api.get( `/storefront/${ encodeURIComponent( slug ) }/browse`, { category: opts.category || undefined, sort: opts.sort === 'new' ? 'new' : undefined } );
  }

  /** A category tap, which ranks the categories on the home page. */
  tap ( slug: string, categoryId: string ): Promise<unknown> {
    return this.api.post( `/storefront/${ encodeURIComponent( slug ) }/taps`, { categoryId } );
  }

  search ( slug: string, query: string ): Promise<SearchResult> {
    return this.api.post( `/storefront/${ encodeURIComponent( slug ) }/search`, { query } );
  }

  product ( slug: string, productId: string ): Promise<PublicProduct> {
    return this.api.get( `/storefront/${ encodeURIComponent( slug ) }/products/${ encodeURIComponent( productId ) }` );
  }

  referral ( slug: string, body: { toStoreId: string; productId: string; sessionId: string; query: string } ): Promise<{ referralId: string; ratePct: number }> {
    return this.api.post( `/storefront/${ encodeURIComponent( slug ) }/referrals`, body );
  }

  feedback ( slug: string, rating: string, query: string ): Promise<unknown> {
    return this.api.post( `/storefront/${ encodeURIComponent( slug ) }/feedback`, { rating, query } );
  }
}
