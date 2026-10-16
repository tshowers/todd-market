import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { Look, PublicProduct, PublicStore, SearchResult } from '../../models/storefront.model';
import { BagService } from '../../services/bag.service';
import { apiErrorMessage } from '../../services/market-api.service';
import { MarketAuthService } from '../../services/market-auth.service';
import { SeoService } from '../../services/seo.service';
import { StorefrontService } from '../../services/storefront.service';
import { brandStyle } from '../../shared/brand/brand-tuning';
import { IconComponent } from '../../shared/icon/icon.component';
import { MoneyPipe } from '../../shared/money.pipe';
import { storeAddress } from '../../shared/store-address';
import { BagDrawerComponent } from './bag-drawer.component';

const TILE_TINTS = ['pink', 'blue', 'cyan', 'violet', 'yellow', 'green'];
const RATINGS = [{ key: 'excellent', label: 'Excellent' }, { key: 'good', label: 'Good' }, { key: 'fair', label: 'Fair' }, { key: 'poor', label: 'Poor' }];

/**
 * A store's Find-style storefront (§2, §3): home, intent search, looks,
 * referral variant C (shared bag), and the bag.
 */
@Component( {
  selector: 'tm-store',
  standalone: true,
  imports: [FormsModule, RouterLink, IconComponent, MoneyPipe, BagDrawerComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'tt-page' },
  templateUrl: './store.component.html',
  styleUrl: './store.component.css',
} )
export class StoreComponent implements OnInit {
  private readonly api = inject( StorefrontService );
  private readonly route = inject( ActivatedRoute );
  private readonly router = inject( Router );
  private readonly seo = inject( SeoService );
  readonly bag = inject( BagService );
  readonly auth = inject( MarketAuthService );

  /** Set when the store is shown on its own domain at "/" (RootComponent). */
  readonly slugOverride = input<string | null>( null );
  readonly store = signal<PublicStore | null>( null );
  readonly notFound = signal( false );
  readonly query = signal( '' );
  readonly result = signal<SearchResult | null>( null );
  readonly searching = signal( false );
  readonly error = signal( '' );
  readonly rating = signal( '' );
  readonly adding = signal( '' );
  readonly ratings = RATINGS;

  readonly style = computed( () => brandStyle( this.store()?.brand.tuned ) );
  readonly initial = computed( () => ( this.store()?.name || '' ).charAt( 0 ).toUpperCase() );
  readonly address = computed( () => this.store() ? storeAddress( this.store()!.slug ) : '' );
  readonly tiles = computed( () => ( this.store()?.quickTiles || [] ).slice( 0, 6 ).map( ( t, i ) => ( { ...t, tint: TILE_TINTS[i % TILE_TINTS.length] } ) ) );
  readonly asked = computed( () => !!this.result() || this.searching() );
  readonly shortName = computed( () => ( this.store()?.name || '' ).split( /\s+/ )[0].replace( /[’']s$/, '' ) + "'s" );

  async ngOnInit (): Promise<void> {
    const slug = this.slugOverride() || this.route.snapshot.paramMap.get( 'slug' ) || '';
    try {
      const store = await this.api.store( slug );
      this.store.set( store );
      this.seo.set( { title: `${ store.name } | TODD Market`, description: store.heroLine || `Shop ${ store.name } on TODD Market.`, path: `/${ store.slug }` } );
      this.seo.setJsonLd( 'store-jsonld', {
        '@context': 'https://schema.org', '@type': 'Store', name: store.name, url: `https://${ this.address() }`,
        hasOfferCatalog: { '@type': 'OfferCatalog', url: `https://market.taliferro.tech/feeds/${ store.slug }.json` },
      } );
    } catch {
      this.notFound.set( true );
      return;
    }
    const q = this.route.snapshot.queryParamMap.get( 'q' );
    if ( q ) await this.ask( q );
  }

  async ask ( text?: string ): Promise<void> {
    const q = ( text ?? this.query() ).trim();
    const store = this.store();
    if ( !q || !store ) return;
    this.query.set( q );
    this.searching.set( true );
    this.error.set( '' );
    this.rating.set( '' );
    void this.router.navigate( [], { queryParams: { q }, replaceUrl: true } );
    try {
      this.result.set( await this.api.search( store.slug, q ) );
    } catch ( error ) {
      this.result.set( null );
      this.error.set( apiErrorMessage( error, 'Search is having trouble. Try again in a moment.' ) );
    } finally {
      this.searching.set( false );
    }
  }

  home (): void {
    this.result.set( null );
    this.query.set( '' );
    this.error.set( '' );
    void this.router.navigate( [], { queryParams: {}, replaceUrl: true } );
  }

  addLook ( look: Look ): void {
    look.items.forEach( ( item ) => this.bag.add( item ) );
  }

  lookInBag ( look: Look ): boolean {
    return look.items.every( ( i ) => this.bag.has( i.id ) );
  }

  /** A network item: record the referral first, so the sale is credited to this store. */
  async addReferred ( product: PublicProduct ): Promise<void> {
    const store = this.store();
    if ( !store || this.adding() ) return;
    this.adding.set( product.id );
    try {
      const { referralId } = await this.api.referral( store.slug, { toStoreId: product.storeId, productId: product.id, sessionId: this.bag.sessionId, query: this.query() } );
      this.bag.add( product, { referralId, referredByStoreId: store.id } );
    } catch ( error ) {
      this.error.set( apiErrorMessage( error, "We couldn't add that item. Try again." ) );
    } finally {
      this.adding.set( '' );
    }
  }

  async rate ( key: string ): Promise<void> {
    const store = this.store();
    if ( !store ) return;
    this.rating.set( key );
    await this.api.feedback( store.slug, key, this.query() ).catch( () => undefined );
  }

  mosaic ( look: Look ): ( { image: string | null; label: string; tint: string } )[] {
    const tints = ['var(--t-pink)', 'var(--t-cyan)', 'var(--surface2)'];
    const items = [...look.items, ...( look.referral ? [look.referral.item] : [] )].slice( 0, 3 );
    return items.map( ( item, i ) => ( { image: item.image, label: item.title, tint: tints[i] } ) );
  }
}
