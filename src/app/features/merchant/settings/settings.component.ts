import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { MerchantStore, ShippingRate, StoreSettings } from '../../../models/merchant.model';
import { apiErrorMessage } from '../../../services/market-api.service';
import { MerchantService, TaxRegistration } from '../../../services/merchant.service';
import { MoneyPipe } from '../../../shared/money.pipe';
import { policySentence } from '../../../shared/return-policy';

type Tab = 'store' | 'returns' | 'tax' | 'shipping';
interface Draft { name: string; slug: string; settings: StoreSettings }

const US_STATES: [string, string][] = Object.entries( {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado', CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia', FL: 'Florida', GA: 'Georgia', HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky', LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota', MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire', NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota', OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island', SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont', VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
} );

/** Merchant settings (f14–f17, m20): Store · Returns · Tax · Shipping, saved together. */
@Component( {
  selector: 'tm-settings',
  standalone: true,
  imports: [FormsModule, RouterLink, MoneyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css',
} )
export class SettingsComponent implements OnInit {
  private readonly merchant = inject( MerchantService );
  private readonly route = inject( ActivatedRoute );
  private readonly router = inject( Router );

  readonly tabs: { key: Tab; label: string }[] = [
    { key: 'store', label: 'Store' }, { key: 'returns', label: 'Returns' }, { key: 'tax', label: 'Tax' }, { key: 'shipping', label: 'Shipping' },
  ];
  readonly windows = [{ days: 14, label: '14 days' }, { days: 30, label: '30 days' }, { days: 60, label: '60 days' }, { days: 0, label: 'No returns' }];
  readonly states = US_STATES;

  readonly tab = signal<Tab>( 'store' );
  readonly store = signal<MerchantStore | null>( null );
  private saved = signal<string>( '' );
  readonly draft = signal<Draft | null>( null );
  readonly categories = signal<string[]>( [] );
  readonly taxStates = signal<TaxRegistration[]>( [] );
  readonly addingState = signal( '' );
  readonly saving = signal( false );
  readonly savedNote = signal( false );
  readonly error = signal( '' );

  readonly dirty = computed( () => !!this.draft() && JSON.stringify( this.draft() ) !== this.saved() );
  readonly policy = computed( () => policySentence( this.draft()?.settings.returns ) );
  readonly finalSaleOptions = computed( () => [...new Set( [...this.categories(), ...( this.draft()?.settings.returns.finalSaleCategories || [] ), 'Sample sale', 'Gift cards'] )] );

  async ngOnInit (): Promise<void> {
    this.route.paramMap.subscribe( ( params ) => {
      const tab = params.get( 'tab' ) as Tab;
      this.tab.set( this.tabs.some( ( t ) => t.key === tab ) ? tab : 'store' );
    } );
    try {
      const { store, taxRegistrations } = await this.merchant.settings();
      this.reset( store );
      this.taxStates.set( taxRegistrations );
      const review = await this.merchant.review().catch( () => null );
      this.categories.set( ( review?.collections || [] ).map( ( c ) => c.name ) );
    } catch ( error ) {
      this.error.set( apiErrorMessage( error, "We couldn't load your settings." ) );
    }
  }

  go ( tab: Tab ): void {
    void this.router.navigate( ['/app/settings', tab] );
  }

  patch<K extends keyof StoreSettings> ( section: K, value: Partial<StoreSettings[K]> ): void {
    this.draft.update( ( d ) => d ? { ...d, settings: { ...d.settings, [section]: { ...d.settings[section], ...value } } } : d );
    this.savedNote.set( false );
  }

  setTop ( key: 'name' | 'slug', value: string ): void {
    this.draft.update( ( d ) => d ? { ...d, [key]: value } : d );
    this.savedNote.set( false );
  }

  setAddress ( key: 'line1' | 'city' | 'state' | 'postal_code', value: string ): void {
    const current = this.draft()?.settings.store.address || { line1: '', city: '', state: '', postal_code: '' };
    this.patch( 'store', { address: { ...current, [key]: value } } );
  }

  toggleFinal ( category: string ): void {
    const list = this.draft()?.settings.returns.finalSaleCategories || [];
    this.patch( 'returns', { finalSaleCategories: list.includes( category ) ? list.filter( ( c ) => c !== category ) : [...list, category] } );
  }

  setRate ( index: number, key: keyof ShippingRate, value: string | number ): void {
    const rates = [...( this.draft()?.settings.shipping.rates || [] )];
    rates[index] = { ...rates[index], [key]: key === 'priceCents' ? Math.round( Number( value ) * 100 ) : value } as ShippingRate;
    this.patch( 'shipping', { rates } );
  }

  addRate (): void {
    const rates = [...( this.draft()?.settings.shipping.rates || [] )];
    rates.push( { id: `rate-${ rates.length + 1 }`, label: 'New rate', detail: '', priceCents: 0, minDays: 3, maxDays: 5 } );
    this.patch( 'shipping', { rates } );
  }

  removeRate ( index: number ): void {
    this.patch( 'shipping', { rates: ( this.draft()?.settings.shipping.rates || [] ).filter( ( _, i ) => i !== index ) } );
  }

  togglePickup ( on: boolean ): void {
    this.patch( 'store', { pickup: on } );
    const rates = this.draft()?.settings.shipping.rates || [];
    if ( on && !rates.some( ( r ) => r.id === 'pickup' ) ) this.patch( 'shipping', { rates: [...rates, { id: 'pickup', label: 'Pickup in store', detail: 'Ready same day', priceCents: 0, minDays: 0, maxDays: 0 }] } );
    if ( !on ) this.patch( 'shipping', { rates: rates.filter( ( r ) => r.id !== 'pickup' ) } );
  }

  setFreeOver ( on: boolean, dollars?: number ): void {
    this.patch( 'shipping', { freeOverCents: on ? Math.round( ( dollars ?? 250 ) * 100 ) : null } );
  }

  discard (): void {
    if ( this.saved() ) this.draft.set( JSON.parse( this.saved() ) );
  }

  async save (): Promise<void> {
    const d = this.draft();
    if ( !d ) return;
    this.saving.set( true );
    this.error.set( '' );
    try {
      const { store } = await this.merchant.saveSettings( { name: d.name, slug: d.slug, ...d.settings } );
      this.reset( store );
      this.savedNote.set( true );
    } catch ( error ) {
      this.error.set( apiErrorMessage( error, "We couldn't save. Try again." ) );
    } finally {
      this.saving.set( false );
    }
  }

  async addState ( state: string ): Promise<void> {
    if ( !state ) return;
    this.addingState.set( state );
    this.error.set( '' );
    try {
      const { registration } = await this.merchant.addTaxState( state );
      this.taxStates.update( ( list ) => [...list.filter( ( r ) => r.state !== registration.state ), registration] );
    } catch ( error ) {
      this.error.set( apiErrorMessage( error ) );
    } finally {
      this.addingState.set( '' );
    }
  }

  private reset ( store: MerchantStore ): void {
    this.store.set( store );
    const draft: Draft = { name: store.name, slug: store.slug, settings: JSON.parse( JSON.stringify( store.settings ) ) };
    this.saved.set( JSON.stringify( draft ) );
    this.draft.set( draft );
  }
}
