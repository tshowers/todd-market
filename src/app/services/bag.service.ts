import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';

import { BagItem, PublicProduct } from '../models/storefront.model';

const BAG_KEY = 'tm-bag';
const SESSION_KEY = 'tm-session';

/**
 * The shared bag (variant C): items from any store in the network, grouped
 * by store, one checkout. Kept in this browser until checkout.
 */
@Injectable( { providedIn: 'root' } )
export class BagService {
  private readonly isBrowser = isPlatformBrowser( inject( PLATFORM_ID ) );
  readonly items = signal<BagItem[]>( this.read() );
  readonly open = signal( false );

  readonly count = computed( () => this.items().reduce( ( n, i ) => n + i.quantity, 0 ) );
  readonly totalCents = computed( () => this.items().reduce( ( n, i ) => n + i.priceCents * i.quantity, 0 ) );
  readonly groups = computed( () => {
    const groups = new Map<string, { storeId: string; storeName: string; storeSlug: string; referred: boolean; items: BagItem[] }>();
    for ( const item of this.items() ) {
      const group = groups.get( item.storeId ) || { storeId: item.storeId, storeName: item.storeName, storeSlug: item.storeSlug, referred: !!item.referralId, items: [] };
      group.items.push( item );
      group.referred = group.referred && !!item.referralId;
      groups.set( item.storeId, group );
    }
    return [...groups.values()];
  } );

  /** A random id for this browser, so a referral can be matched to the purchase. */
  readonly sessionId: string = this.session();

  add ( product: PublicProduct, options: { variantId?: string | null; referralId?: string | null; referredByStoreId?: string | null } = {} ): void {
    const variant = product.variants.find( ( v ) => v.id === options.variantId ) || product.variants.find( ( v ) => v.available ) || null;
    const key = `${ product.storeId }:${ product.id }:${ variant?.id || '' }`;
    this.items.update( ( items ) => {
      const existing = items.find( ( i ) => i.key === key );
      if ( existing ) return items.map( ( i ) => i.key === key ? { ...i, quantity: i.quantity + 1 } : i );
      return [...items, {
        key,
        storeId: product.storeId, storeName: product.storeName, storeSlug: product.storeSlug,
        productId: product.id, variantId: variant?.id || null, variantTitle: variant?.title || '',
        title: product.title, priceCents: variant?.priceCents ?? product.priceCents, image: product.image, quantity: 1,
        referralId: options.referralId || null, referredByStoreId: options.referredByStoreId || null,
      }];
    } );
    this.write();
  }

  has ( productId: string ): boolean {
    return this.items().some( ( i ) => i.productId === productId );
  }

  setQuantity ( key: string, quantity: number ): void {
    this.items.update( ( items ) => quantity <= 0 ? items.filter( ( i ) => i.key !== key ) : items.map( ( i ) => i.key === key ? { ...i, quantity } : i ) );
    this.write();
  }

  clear (): void {
    this.items.set( [] );
    this.write();
  }

  private read (): BagItem[] {
    if ( !this.isBrowser ) return [];
    try {
      const parsed = JSON.parse( localStorage.getItem( BAG_KEY ) || '[]' );
      return Array.isArray( parsed ) ? parsed : [];
    } catch {
      return [];
    }
  }

  private write (): void {
    if ( !this.isBrowser ) return;
    try { localStorage.setItem( BAG_KEY, JSON.stringify( this.items() ) ); } catch { /* storage blocked: the bag lasts this visit */ }
  }

  private session (): string {
    if ( !this.isBrowser ) return '';
    try {
      let id = localStorage.getItem( SESSION_KEY );
      if ( !id ) {
        id = crypto.randomUUID();
        localStorage.setItem( SESSION_KEY, id );
      }
      return id;
    } catch {
      return crypto.randomUUID();
    }
  }
}
