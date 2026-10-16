import { Injectable, inject, signal } from '@angular/core';

import { BuildJob, CustomDomain, MerchantStore, Palette, ReviewData, StoreBrand, StoreSettings, Voice } from '../models/merchant.model';

export interface LedgerRow {
  id: string; direction: 'sent' | 'received'; store: string; item: string; date: number; saleCents: number; commissionCents: number;
  status: 'browsing' | 'bought' | 'expired'; commissionStatus: 'pending' | 'payable' | 'paid' | 'voided' | null; returnWindowEndsAt: number | null; payDate: number | null;
}
export interface NetworkNode { id: string; name: string; sent: number; received: number; earnedCents: number; ratePct: number | null; kind: string; blocked: boolean }
export interface Dashboard {
  store: { id: string; name: string }; month: string; networkCount: number; totalStores: number;
  kpis: { sent: number; sentBought: number; earnedCents: number; nextPayDate: number | null; received: number; receivedBought: number; paidOutCents: number; salesFromReferralsCents: number };
  ledger: LedgerRow[]; nodes: NetworkNode[];
  controls: MerchantStore['referral'] & { categories: string[]; blockedStores: { id: string; name: string }[] };
  qualify: number[];
}
export interface MerchantOrder {
  id: string; paidAt: number; email: string; address: { name: string; phone: string; line1: string; city: string; state: string; postal_code: string };
  items: { title: string; variantTitle: string; quantity: number; priceCents: number; image: string | null; referred: boolean }[];
  shippingRate: { label: string } | null; subtotalCents: number; shippingCents: number; taxCents: number; totalCents: number;
  platformFeeCents: number; commissionCents: number; refundedCents: number;
  fulfillment: { status: string; tracking: string | null };
}
export interface MerchantReturn {
  id: string; orderId: string; email: string; items: { title: string; quantity: number }[]; reason: string; note: string;
  refundMethod: string; sendBack: string; refundCents: number; status: 'requested' | 'refunded'; createdAt: number;
}
export interface TaxRegistration { id: string; state: string; name: string; status: string }
import { MarketApiService } from './market-api.service';

export type ImportSource = 'shopify' | 'csv';

export interface ImportRequest {
  source: ImportSource;
  shopifyUrl?: string;
  csvText?: string;
  fileName?: string;
  storeName?: string;
}

/** The signed-in merchant's store, and every onboarding call. */
@Injectable( { providedIn: 'root' } )
export class MerchantService {
  private readonly api = inject( MarketApiService );
  /** undefined until loaded; null when the merchant has no store yet. */
  readonly store = signal<MerchantStore | null | undefined>( undefined );

  async load (): Promise<MerchantStore | null> {
    const { store } = await this.api.get<{ store: MerchantStore | null; build?: BuildJob | null }>( '/merchant/store' );
    this.store.set( store );
    return store;
  }

  /** The loaded store, loading it first if needed. */
  async current (): Promise<MerchantStore | null> {
    const store = this.store();
    return store === undefined ? this.load() : store;
  }

  preview ( request: ImportRequest ): Promise<{ name: string; productCount: number; photoCount: number; unpriced: number }> {
    return this.api.post( '/merchant/import/preview', request );
  }

  async import ( request: ImportRequest ): Promise<{ storeId: string; productCount: number; paletteFromTheme: boolean }> {
    const result = await this.api.post<{ storeId: string; productCount: number; paletteFromTheme: boolean }>( '/merchant/import', request );
    await this.load();
    return result;
  }

  async saveBrand ( body: { palette?: Partial<Palette>; logoDataUrl?: string; removeLogo?: boolean } ): Promise<StoreBrand> {
    const { brand } = await this.api.put<{ brand: StoreBrand }>( '/merchant/store/brand', body );
    this.store.update( ( store ) => store ? { ...store, brand } : store );
    return brand;
  }

  startBuild (): Promise<{ jobId: string }> {
    return this.api.post( '/merchant/build' );
  }

  build ( jobId: string ): Promise<BuildJob> {
    return this.api.get( `/merchant/build/${ encodeURIComponent( jobId ) }` );
  }

  async latestBuild (): Promise<BuildJob | null> {
    const { build } = await this.api.get<{ store: MerchantStore | null; build?: BuildJob | null }>( '/merchant/store' );
    return build ?? null;
  }

  review (): Promise<ReviewData> {
    return this.api.get( '/merchant/review' );
  }

  async update ( body: { voice?: Voice; onboardingStep?: string } ): Promise<MerchantStore> {
    const { store } = await this.api.patch<{ store: MerchantStore }>( '/merchant/store', body );
    this.store.set( store );
    return store;
  }

  setCollection ( id: string, enabled: boolean ): Promise<unknown> {
    return this.api.patch( `/merchant/collections/${ encodeURIComponent( id ) }`, { enabled } );
  }

  resolveIssue ( id: string ): Promise<unknown> {
    return this.api.post( `/merchant/issues/${ encodeURIComponent( id ) }/resolve` );
  }

  async stripeLink ( phase: 'accept' | 'payouts' ): Promise<string> {
    const { url } = await this.api.post<{ url: string }>( '/merchant/stripe/link', { phase } );
    return url;
  }

  async syncStripe (): Promise<MerchantStore> {
    const { store } = await this.api.post<{ store: MerchantStore }>( '/merchant/stripe/sync' );
    this.store.set( store );
    return store;
  }

  async goLive (): Promise<MerchantStore> {
    const { store } = await this.api.post<{ store: MerchantStore }>( '/merchant/go-live' );
    this.store.set( store );
    return store;
  }

  connectDomain ( domain: string ): Promise<{ customDomain: CustomDomain }> {
    return this.api.post( '/merchant/settings/domain', { domain } );
  }

  checkDomain (): Promise<{ customDomain: CustomDomain | null }> {
    return this.api.get( '/merchant/settings/domain' );
  }

  disconnectDomain (): Promise<unknown> {
    return this.api.delete( '/merchant/settings/domain' );
  }

  settings (): Promise<{ store: MerchantStore; categories: string[]; policy: string; taxRegistrations: TaxRegistration[] }> {
    return this.api.get( '/merchant/settings' );
  }

  async saveSettings ( body: Partial<StoreSettings> & { name?: string; slug?: string; directoryCategory?: string } ): Promise<{ store: MerchantStore; policy: string }> {
    const result = await this.api.put<{ store: MerchantStore; policy: string }>( '/merchant/settings', body );
    this.store.set( result.store );
    return result;
  }

  addTaxState ( state: string ): Promise<{ registration: TaxRegistration }> {
    return this.api.post( '/merchant/settings/tax/registrations', { state } );
  }

  dashboard ( month?: string ): Promise<Dashboard> {
    return this.api.get( '/merchant/dashboard', { month } );
  }

  saveControls ( body: Partial<MerchantStore['referral']> ): Promise<{ referral: MerchantStore['referral'] }> {
    return this.api.patch( '/merchant/referral-controls', body );
  }

  orders (): Promise<{ orders: MerchantOrder[]; returns: MerchantReturn[] }> {
    return this.api.get( '/merchant/orders' );
  }

  setFulfillment ( orderId: string, status: string, tracking?: string ): Promise<unknown> {
    return this.api.post( `/merchant/orders/${ encodeURIComponent( orderId ) }/fulfillment`, { status, tracking } );
  }

  receiveReturn ( returnId: string ): Promise<unknown> {
    return this.api.post( `/merchant/returns/${ encodeURIComponent( returnId ) }/received` );
  }

  async startOver (): Promise<void> {
    await this.api.post( '/merchant/start-over' );
    await this.load();
  }
}
