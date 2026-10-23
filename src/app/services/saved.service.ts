import { Injectable, computed, inject, signal } from '@angular/core';

import { AccountService, SavedItem } from './account.service';
import { MarketAuthService } from './market-auth.service';

/** The heart on product cards: the signed-in shopper's saved items, from any store. */
@Injectable( { providedIn: 'root' } )
export class SavedService {
  private readonly account = inject( AccountService );
  private readonly auth = inject( MarketAuthService );

  readonly items = signal<SavedItem[]>( [] );
  private readonly keys = computed( () => new Set( this.items().map( ( s ) => `${ s.storeId }:${ s.productId }` ) ) );
  private loadedFor = '';

  /** Loads the list once per signed-in shopper. */
  async load (): Promise<void> {
    const user = await this.auth.ready;
    if ( !user || this.loadedFor === user.uid ) return;
    this.loadedFor = user.uid;
    try {
      this.items.set( ( await this.account.profile() ).saved );
    } catch {
      this.loadedFor = '';
    }
  }

  has ( storeId: string, productId: string ): boolean {
    return this.keys().has( `${ storeId }:${ productId }` );
  }

  /** Saves or unsaves; puts the list back if the server refuses. */
  async toggle ( item: SavedItem ): Promise<void> {
    const before = this.items();
    const next = this.has( item.storeId, item.productId )
      ? before.filter( ( s ) => !( s.storeId === item.storeId && s.productId === item.productId ) )
      : [item, ...before];
    this.items.set( next );
    try {
      await this.account.saveSaved( next );
    } catch {
      this.items.set( before );
    }
  }
}
