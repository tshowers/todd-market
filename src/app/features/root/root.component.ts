import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';

import { ShopService } from '../../services/shop.service';
import { ShopComponent } from '../shop/shop.component';
import { StoreComponent } from '../storefront/store.component';

/**
 * "/": the shopper home (Search all stores / Shop stores) on TODD Market's
 * own hosts, or the store itself on a store's own domain
 * (shop.amysshoes.com). The prerendered page is the shopper home.
 */
@Component( {
  selector: 'tm-root-page',
  standalone: true,
  imports: [ShopComponent, StoreComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'tt-page' },
  template: `@if (hostSlug(); as slug) { <tm-store [slugOverride]="slug" /> } @else { <tm-shop /> }`,
  styles: [':host { display: flex; flex-direction: column; flex: 1 0 auto; }'],
} )
export class RootComponent implements OnInit {
  private readonly shop = inject( ShopService );
  readonly hostSlug = signal<string | null>( null );

  async ngOnInit (): Promise<void> {
    const store = await this.shop.storeForThisHost();
    if ( store ) this.hostSlug.set( store.slug );
  }
}
