import { Injectable, inject } from '@angular/core';

import { Address, QuotePart } from './checkout.service';
import { MarketApiService } from './market-api.service';

export interface AccountOrder { id: string; paidAt: number; totalCents: number; stores: string[]; status: 'in_progress' | 'delivered' | 'refunded'; image: string | null }
export interface ReturnableItem { productId: string; variantId: string | null; title: string; variantTitle: string; priceCents: number; quantity: number; image: string | null }
export interface OrderDetailPart extends QuotePart {
  status: string; fulfillment: { status: string; tracking: string | null; deliveredAt: number | null } | null; refundedCents: number;
  returnableUntil: number | null; returnableItems: ReturnableItem[]; returnPolicy: string; returnShippingCents: number;
  storeLocation: string; pickup: boolean; referred: boolean;
}
export interface OrderDetail { id: string; status: string; paidAt: number; totalCents: number; card: { brand: string; last4: string } | null; address: Address; email: string; parts: OrderDetailPart[]; reasons: string[] }
export interface StartedReturn { id: string; refundCents: number; sendBack: 'label' | 'dropoff'; refundMethod: 'original' | 'exchange'; storeName: string; card: { brand: string; last4: string } | null }

/** The signed-in shopper's account. */
@Injectable( { providedIn: 'root' } )
export class AccountService {
  private readonly api = inject( MarketApiService );

  orders (): Promise<{ orders: AccountOrder[] }> { return this.api.get( '/account/orders' ); }
  order ( id: string ): Promise<OrderDetail> { return this.api.get( `/account/orders/${ encodeURIComponent( id ) }` ); }
  startReturn ( orderId: string, body: unknown ): Promise<StartedReturn> { return this.api.post( `/account/orders/${ encodeURIComponent( orderId ) }/returns`, body ); }
  profile (): Promise<{ email: string; name: string; addresses: Address[]; saved: { storeId: string; productId: string; title: string; storeName: string; storeSlug: string; image: string | null }[] }> { return this.api.get( '/account/profile' ); }
  saveAddresses ( addresses: Address[] ): Promise<{ addresses: Address[] }> { return this.api.put( '/account/addresses', { addresses } ); }
  paymentMethods (): Promise<{ methods: { id: string; brand: string; last4: string; expMonth: number; expYear: number }[] }> { return this.api.get( '/account/payment-methods' ); }
  removePaymentMethod ( id: string ): Promise<unknown> { return this.api.delete( `/account/payment-methods/${ encodeURIComponent( id ) }` ); }
}
