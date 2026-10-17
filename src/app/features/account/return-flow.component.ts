import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AccountService, OrderDetail, OrderDetailPart, ReturnableItem, StartedReturn } from '../../services/account.service';
import { apiErrorMessage } from '../../services/market-api.service';
import { MoneyPipe } from '../../shared/money.pipe';

type Step = 'items' | 'reason' | 'refund' | 'done';

/** Return an item (f10–f13): Items · Reason · Refund · Done. The store refunds when it receives them. */
@Component( {
  selector: 'tm-return-flow',
  standalone: true,
  imports: [FormsModule, RouterLink, MoneyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './return-flow.component.html',
  styleUrl: './return-flow.component.css',
} )
export class ReturnFlowComponent implements OnInit {
  private readonly route = inject( ActivatedRoute );
  private readonly account = inject( AccountService );

  readonly steps: { key: Step; label: string }[] = [{ key: 'items', label: 'Items' }, { key: 'reason', label: 'Reason' }, { key: 'refund', label: 'Refund' }, { key: 'done', label: 'Done' }];
  readonly order = signal<OrderDetail | null>( null );
  readonly part = signal<OrderDetailPart | null>( null );
  readonly step = signal<Step>( 'items' );
  readonly chosen = signal<Set<string>>( new Set() );
  readonly reason = signal( '' );
  readonly note = signal( '' );
  readonly refundMethod = signal<'original' | 'exchange'>( 'original' );
  readonly sendBack = signal<'label' | 'dropoff'>( 'label' );
  readonly result = signal<StartedReturn | null>( null );
  /** Exchange: the new variant for each returned item. */
  readonly swaps = signal<Record<string, string>>( {} );
  readonly busy = signal( false );
  readonly error = signal( '' );

  readonly stepIndex = computed( () => this.steps.findIndex( ( s ) => s.key === this.step() ) );
  readonly key = ( i: { productId: string; variantId: string | null } ) => `${ i.productId }:${ i.variantId || '' }`;
  readonly selectedItems = computed( () => ( this.part()?.returnableItems || [] ).filter( ( i ) => this.chosen().has( this.key( i ) ) ) );
  readonly canExchange = computed( () => this.selectedItems().length > 0 && this.selectedItems().every( ( i ) => ( i.swaps || [] ).length > 0 ) );
  readonly swapsChosen = computed( () => this.selectedItems().every( ( i ) => !!this.swaps()[this.key( i )] ) );
  readonly refund = computed( () => {
    const part = this.part();
    if ( !part ) return 0;
    const merchandise = this.selectedItems().reduce( ( s, i ) => s + i.priceCents * i.quantity, 0 );
    const tax = part.subtotalCents ? Math.round( part.taxCents * merchandise / part.subtotalCents ) : 0;
    const label = this.sendBack() === 'label' ? part.returnShippingCents : 0;
    return Math.max( 0, merchandise + tax - label );
  } );

  async ngOnInit (): Promise<void> {
    try {
      const order = await this.account.order( this.route.snapshot.paramMap.get( 'id' ) || '' );
      this.order.set( order );
      const storeId = this.route.snapshot.queryParamMap.get( 'store' );
      this.part.set( order.parts.find( ( p ) => p.storeId === storeId ) || order.parts.find( ( p ) => p.returnableItems.length ) || null );
    } catch ( error ) {
      this.error.set( apiErrorMessage( error, "We couldn't load that order." ) );
    }
  }

  toggle ( k: string ): void {
    const next = new Set( this.chosen() );
    if ( next.has( k ) ) next.delete( k ); else next.add( k );
    this.chosen.set( next );
    if ( !this.canExchange() ) this.refundMethod.set( 'original' );
  }

  swapFor ( i: ReturnableItem ): string {
    return this.swaps()[this.key( i )] || '';
  }

  setSwap ( i: ReturnableItem, variantId: string ): void {
    this.swaps.update( ( s ) => ( { ...s, [this.key( i )]: variantId } ) );
  }

  swapSummary ( r: StartedReturn ): string {
    return ( r.exchange || [] ).map( ( x ) => `${ x.title } in ${ x.toTitle }` ).join( ', ' );
  }

  date ( ms: number | null | undefined ): string {
    return ms ? new Date( ms ).toLocaleDateString( 'en-US', { month: 'short', day: 'numeric' } ) : '';
  }

  async submit (): Promise<void> {
    const order = this.order(), part = this.part();
    if ( !order || !part ) return;
    this.busy.set( true );
    this.error.set( '' );
    try {
      this.result.set( await this.account.startReturn( order.id, {
        storeId: part.storeId,
        items: this.selectedItems().map( ( i ) => ( { productId: i.productId, variantId: i.variantId, quantity: i.quantity } ) ),
        reason: this.reason(), note: this.note(), refundMethod: this.refundMethod(), sendBack: this.sendBack(),
        ...( this.refundMethod() === 'exchange' ? { exchanges: this.swaps() } : {} ),
      } ) );
      this.step.set( 'done' );
    } catch ( error ) {
      this.error.set( apiErrorMessage( error, "We couldn't start the return. Try again." ) );
    } finally {
      this.busy.set( false );
    }
  }
}
