import { Injectable, inject } from '@angular/core';

import { BagItem } from '../models/storefront.model';
import { MarketApiService } from './market-api.service';

export interface Address { name: string; phone: string; line1: string; city: string; state: string; postal_code: string }
export interface ShippingOption { id: string; label: string; detail: string; priceCents: number; minDays: number; maxDays: number }
export interface QuotePart {
  storeId: string; storeName: string; storeSlug: string; accountId: string;
  items: { productId: string; variantId: string | null; variantTitle: string; title: string; image: string | null; priceCents: number; quantity: number; referred: boolean }[];
  shippingRate: ShippingOption | null; shippingOptions: ShippingOption[];
  subtotalCents: number; shippingCents: number; taxCents: number; totalCents: number; taxCalculated: boolean;
}
export interface Quote { orderId: string; viewToken?: string; clientSecret?: string; parts: QuotePart[]; totalCents: number }
export type PayResult =
  | { status: 'paid'; orderId: string }
  | { status: 'failed'; error: string }
  | { status: 'processing' }
  | { status: 'needs_action'; actions: { storeId: string; storeName: string; accountId: string; clientSecret: string }[] };

export interface OrderView {
  id: string; status: string; email: string; address: Address; paidAt: number | null; totalCents: number;
  card: { brand: string; last4: string; wallet: string | null } | null;
  parts: ( QuotePart & { status: string; fulfillment: { status: string; tracking: string | null; shippedAt: number | null; deliveredAt: number | null } | null; returnableUntil: number | null } )[];
}

const TOKENS_KEY = 'tm-order-tokens';

/** Checkout and order calls; guest order tokens are kept in this browser. */
@Injectable( { providedIn: 'root' } )
export class CheckoutService {
  private readonly api = inject( MarketApiService );

  start ( body: { email: string; address: Address; lines: unknown[]; shipping: Record<string, string> } ): Promise<Quote> {
    return this.api.post<Quote>( '/checkout/start', body ).then( ( quote ) => {
      if ( quote.viewToken ) this.saveToken( quote.orderId, quote.viewToken );
      return quote;
    } );
  }

  update ( orderId: string, body: { email: string; address: Address; lines: unknown[]; shipping: Record<string, string> } ): Promise<Quote> {
    return this.api.put( `/checkout/${ orderId }${ this.q( orderId ) }`, body );
  }

  pay ( orderId: string ): Promise<PayResult> {
    return this.api.post( `/checkout/${ orderId }/pay${ this.q( orderId ) }` );
  }

  finalize ( orderId: string ): Promise<PayResult> {
    return this.api.post( `/checkout/${ orderId }/finalize${ this.q( orderId ) }` );
  }

  order ( orderId: string, token?: string ): Promise<OrderView> {
    if ( token ) this.saveToken( orderId, token );
    return this.api.get( `/orders/${ encodeURIComponent( orderId ) }${ this.q( orderId ) }` );
  }

  static lines ( items: BagItem[] ): unknown[] {
    return items.map( ( i ) => ( { storeId: i.storeId, productId: i.productId, variantId: i.variantId, quantity: i.quantity, referralId: i.referralId } ) );
  }

  private q ( orderId: string ): string {
    const token = this.tokens()[orderId];
    return token ? `?token=${ encodeURIComponent( token ) }` : '';
  }

  private tokens (): Record<string, string> {
    try { return JSON.parse( localStorage.getItem( TOKENS_KEY ) || '{}' ); } catch { return {}; }
  }

  private saveToken ( orderId: string, token: string ): void {
    try { localStorage.setItem( TOKENS_KEY, JSON.stringify( { ...this.tokens(), [orderId]: token } ) ); } catch { /* storage blocked */ }
  }
}
