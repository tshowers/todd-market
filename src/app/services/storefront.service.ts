import { Injectable, inject } from '@angular/core';

import { PublicProduct, PublicStore, SearchResult } from '../models/storefront.model';
import { MarketApiService } from './market-api.service';

/** The public storefront calls. */
@Injectable( { providedIn: 'root' } )
export class StorefrontService {
  private readonly api = inject( MarketApiService );

  store ( slug: string ): Promise<PublicStore> {
    return this.api.get( `/storefront/${ encodeURIComponent( slug ) }` );
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
