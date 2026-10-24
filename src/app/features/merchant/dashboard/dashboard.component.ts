import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';

import { apiErrorMessage } from '../../../services/market-api.service';
import { Dashboard, LedgerRow, MerchantService, NetworkNode } from '../../../services/merchant.service';
import { MoneyPipe } from '../../../shared/money.pipe';
import { shortStoreName } from '../../../shared/short-store-name';

type Filter = 'all' | 'sent' | 'received';
const SLOTS: [number, number][] = [[282, 102], [128, 104], [138, 222], [270, 228], [86, 166], [320, 166]];

/** The referral dashboard (§4: d15, d16, d19, m09): KPIs, Ledger or Network map, Controls. */
@Component( {
  selector: 'tm-dashboard',
  standalone: true,
  imports: [MoneyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
} )
export class DashboardComponent implements OnInit {
  readonly short = shortStoreName;
  private readonly merchant = inject( MerchantService );
  readonly data = signal<Dashboard | null>( null );
  readonly error = signal( '' );
  readonly layout = signal<'ledger' | 'map'>( 'ledger' );
  readonly filter = signal<Filter>( 'all' );
  readonly selected = signal<string | null>( null );
  readonly minPct = signal( 8 );

  readonly rows = computed( () => ( this.data()?.ledger || [] ).filter( ( r ) => this.filter() === 'all' || r.direction === this.filter() ) );
  readonly qualifying = computed( () => this.data()?.qualify[this.minPct()] ?? 0 );
  readonly placed = computed( () => ( this.data()?.nodes || [] ).map( ( n, i ) => ( { ...n, x: SLOTS[i][0], y: SLOTS[i][1], short: initials( n.name ) } ) ) );
  readonly node = computed( () => this.placed().find( ( n ) => n.id === this.selected() ) || this.placed()[0] || null );

  async ngOnInit (): Promise<void> {
    try {
      const data = await this.merchant.dashboard();
      this.data.set( data );
      this.minPct.set( data.controls.minCommissionPct ?? 8 );
    } catch ( error ) {
      this.error.set( apiErrorMessage( error, "We couldn't load your referrals." ) );
    }
  }

  isSelected ( id: string ): boolean {
    return this.node()?.id === id;
  }

  stroke ( n: NetworkNode ): number {
    return n.blocked ? 0 : Math.max( 2.5, ( n.sent + n.received ) / 2.2 );
  }

  path ( x: number, y: number ): string {
    const cx = 200, cy = 160;
    const mx = ( cx + x ) / 2 + ( y - cy ) * 0.18, my = ( cy + y ) / 2 - ( x - cx ) * 0.18;
    return `M${ cx } ${ cy } Q${ mx } ${ my } ${ x } ${ y }`;
  }

  tag ( r: LedgerRow ): { label: string; tint: string } {
    if ( r.status === 'browsing' ) return { label: 'Browsing', tint: 'yellow' };
    if ( r.status === 'expired' ) return { label: 'Expired', tint: '' };
    switch ( r.commissionStatus ) {
      case 'voided': return { label: 'Voided (returned)', tint: 'pink' };
      case 'paid': return { label: 'Paid', tint: 'green' };
      case 'pending': return { label: `Pending until ${ short( r.returnWindowEndsAt ) }`, tint: 'blue' };
      default: return { label: 'Bought', tint: 'green' };
    }
  }

  date ( ms: number | null ): string {
    return short( ms );
  }

  async saveMin (): Promise<void> {
    await this.save( { minCommissionPct: this.minPct() } );
  }

  async toggleCategory ( category: string ): Promise<void> {
    const list = this.data()?.controls.blockedCategories || [];
    await this.save( { blockedCategories: list.includes( category ) ? list.filter( ( c ) => c !== category ) : [...list, category] } );
  }

  async block ( id: string, blocked: boolean ): Promise<void> {
    const list = this.data()?.controls.blockedStoreIds || [];
    await this.save( { blockedStoreIds: blocked ? [...new Set( [...list, id] )] : list.filter( ( x ) => x !== id ) } );
    await this.ngOnInit();
  }

  async setNetworkSearch ( on: boolean ): Promise<void> {
    await this.save( { networkSearch: on } );
  }

  async setWebListings ( on: boolean ): Promise<void> {
    await this.save( { webListings: on } );
  }

  async acceptFrom ( value: 'any' | 'approved' ): Promise<void> {
    await this.save( { acceptFrom: value } );
  }

  private async save ( body: Parameters<MerchantService['saveControls']>[0] ): Promise<void> {
    const data = this.data();
    if ( !data ) return;
    this.data.set( { ...data, controls: { ...data.controls, ...body } } );
    try {
      await this.merchant.saveControls( body );
    } catch ( error ) {
      this.error.set( apiErrorMessage( error, "We couldn't save that. Try again." ) );
    }
  }
}

function initials ( name: string ): string {
  const words = name.replace( /['’]s\b/g, '' ).split( /[\s&]+/ ).filter( Boolean );
  return ( words.length > 1 ? words[0][0] + words[1][0] : name.slice( 0, 3 ) ).toUpperCase();
}

function short ( ms: number | null ): string {
  return ms ? new Date( ms ).toLocaleDateString( 'en-US', { month: 'short', day: 'numeric' } ) : '';
}
