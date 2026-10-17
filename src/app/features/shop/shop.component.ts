import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { BagService } from '../../services/bag.service';
import { apiErrorMessage } from '../../services/market-api.service';
import { MarketAuthService } from '../../services/market-auth.service';
import { SeoService } from '../../services/seo.service';
import { DirectoryStore, Listing, NetworkItem, NetworkResult, ShopService } from '../../services/shop.service';
import { IconComponent } from '../../shared/icon/icon.component';
import { MoneyPipe } from '../../shared/money.pipe';
import { PlatformMenuComponent } from '../../shared/platform-menu/platform-menu.component';
import { RingIconComponent } from '../../shared/ring-icon/ring-icon.component';
import { BagDrawerComponent } from '../storefront/bag-drawer.component';
import { InterestDialogComponent } from './interest-dialog.component';

type View = 'search' | 'stores';
const PAGE = 24;
const SUGGESTIONS = [
  { label: 'Groomsman gifts under $60', tint: 'pink' },
  { label: 'Black dress shoes, size 11', tint: 'cyan' },
  { label: 'Outfit for an outdoor wedding, under $300', tint: 'green' },
];

/**
 * The shopper home at "/" (design Part 3, g02–g08, m21–m24): one search
 * across every store, toggled with the store directory. "Open a store"
 * takes merchants to /sell.
 */
@Component( {
  selector: 'tm-shop',
  standalone: true,
  imports: [FormsModule, RouterLink, IconComponent, MoneyPipe, RingIconComponent, PlatformMenuComponent, BagDrawerComponent, InterestDialogComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shop.component.html',
  styleUrl: './shop.component.css',
} )
export class ShopComponent implements OnInit {
  private readonly shop = inject( ShopService );
  private readonly route = inject( ActivatedRoute );
  private readonly router = inject( Router );
  readonly bag = inject( BagService );
  readonly auth = inject( MarketAuthService );

  readonly suggestions = SUGGESTIONS;
  readonly view = signal<View>( 'search' );
  readonly query = signal( '' );
  readonly result = signal<NetworkResult | null>( null );
  readonly searching = signal( false );
  readonly layout = signal<'item' | 'store'>( 'item' );
  readonly storeFilter = signal<string | null>( null );
  readonly stores = signal<DirectoryStore[]>( [] );
  readonly listings = signal<Listing[]>( [] );
  readonly listingsShown = signal( 12 );
  /** The "Want to buy it here?" dialog, when open. */
  readonly interestFor = signal<{ domain: string; name: string; url: string; productUrl?: string; productTitle?: string } | null>( null );
  readonly filteredListings = computed( () => this.listings().filter( ( l ) => this.category() === 'All' || l.category === this.category() ) );
  readonly categories = signal<string[]>( [] );
  readonly category = signal( 'All' );
  readonly shown = signal( PAGE );
  readonly loadingStores = signal( false );
  readonly error = signal( '' );

  readonly filteredStores = computed( () => this.stores().filter( ( s ) => this.category() === 'All' || s.category === this.category() ) );
  readonly visibleStores = computed( () => this.filteredStores().slice( 0, this.shown() ) );
  readonly items = computed( () => ( this.result()?.items || [] ).filter( ( i ) => !this.storeFilter() || i.storeId === this.storeFilter() ) );
  readonly groups = computed( () => ( this.result()?.stores || [] ).filter( ( s ) => !this.storeFilter() || s.id === this.storeFilter() )
    .map( ( s ) => ( { store: s, items: ( this.result()?.items || [] ).filter( ( i ) => i.storeId === s.id ) } ) ) );
  /** Checkout carries one store's brand; from the shopper home, the first store in the bag. */
  readonly checkoutSlug = computed( () => this.bag.groups().length ? this.bag.groups()[0].storeSlug : '' );
  readonly city = computed( () => {
    const cities = [...new Set( this.stores().map( ( s ) => s.location ).filter( Boolean ) )];
    return cities.length === 1 ? cities[0] : '';
  } );

  constructor () {
    inject( SeoService ).set( {
      title: 'TODD Market: Shop independent stores',
      description: 'One search across every independent store in the TODD Market network, or browse the stores one at a time.',
      path: '/',
    } );
  }

  async ngOnInit (): Promise<void> {
    const params = this.route.snapshot.queryParamMap;
    this.view.set( params.get( 'view' ) === 'stores' || this.route.snapshot.data['view'] === 'stores' ? 'stores' : 'search' );
    void this.loadStores();
    const q = params.get( 'q' );
    if ( q ) await this.ask( q );
  }

  setView ( view: View ): void {
    this.view.set( view );
    void this.router.navigate( ['/'], { queryParams: view === 'stores' ? { view: 'stores' } : ( this.query() && this.result() ? { q: this.query() } : {} ), replaceUrl: true } );
  }

  async ask ( text?: string ): Promise<void> {
    const q = ( text ?? this.query() ).trim();
    if ( !q ) return;
    this.query.set( q );
    this.view.set( 'search' );
    this.searching.set( true );
    this.error.set( '' );
    this.storeFilter.set( null );
    void this.router.navigate( ['/'], { queryParams: { q }, replaceUrl: true } );
    try {
      this.result.set( await this.shop.search( q ) );
    } catch ( error ) {
      this.result.set( null );
      this.error.set( apiErrorMessage( error, 'Search is having trouble. Try again in a moment.' ) );
    } finally {
      this.searching.set( false );
    }
  }

  add ( item: NetworkItem ): void {
    this.bag.add( item );
  }

  storeLink ( s: { slug: string; customDomain?: string | null } ): string {
    return s.customDomain ? `https://${ s.customDomain }` : `/${ s.slug }`;
  }

  initial ( name: string ): string {
    return name.charAt( 0 ).toUpperCase();
  }

  private async loadStores (): Promise<void> {
    this.loadingStores.set( true );
    try {
      const { stores, listings, categories } = await this.shop.stores();
      this.stores.set( stores );
      this.listings.set( listings || [] );
      this.categories.set( categories );
    } catch {
      this.stores.set( [] );
    } finally {
      this.loadingStores.set( false );
    }
  }
}
