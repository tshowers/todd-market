import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { apiErrorMessage } from '../../../services/market-api.service';
import { MerchantOrder, MerchantReturn, MerchantService } from '../../../services/merchant.service';
import { MoneyPipe } from '../../../shared/money.pipe';

/**
 * Merchant Orders. Not in the handoff (plan: "still not designed"), so it's
 * plain and built from the Find tokens: the store's part of each order,
 * fulfillment (preparing → shipped with tracking → delivered, which starts
 * the return window) and returns to mark received (which refunds).
 */
@Component( {
  selector: 'tm-orders',
  standalone: true,
  imports: [FormsModule, MoneyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="wrap">
      <h1 class="tm-h1">Orders</h1>
      @if (openReturns().length) {
        <div class="returns">
          <h2>Returns to receive</h2>
          @for (r of openReturns(); track r.id) {
            <div class="ret">
              <div><strong>{{ r.orderId }}</strong> · {{ r.items.map(itemLabel).join(', ') }}<br><span class="muted">{{ r.reason }}{{ r.note ? ' · “' + r.note + '”' : '' }} · {{ r.sendBack === 'label' ? 'Email them a return label' : 'Drop-off at your store' }} · {{ r.email }}</span></div>
              <button type="button" class="tm-btn tm-btn--primary" [disabled]="busy() === r.id" (click)="receive(r)">Received · refund {{ r.refundCents | money: true }}</button>
            </div>
          }
        </div>
      }
      @for (o of orders(); track o.id) {
        <article class="order">
          <div class="top">
            <div><strong>{{ o.id }}</strong><span class="muted"> · {{ date(o.paidAt) }} · {{ o.address.name }}</span></div>
            <strong>{{ o.totalCents | money: true }}</strong>
          </div>
          <ul>@for (i of o.items; track $index) { <li>{{ i.title }}{{ i.variantTitle ? ' · ' + i.variantTitle : '' }} × {{ i.quantity }}@if (i.referred) { <span class="tm-tag tm-tint-cyan">referred</span> }</li> }</ul>
          <p class="muted">Ship {{ o.shippingRate?.label || '' }} to {{ o.address.line1 }}, {{ o.address.city }}, {{ o.address.state }} {{ o.address.postal_code }}{{ o.address.phone ? ' · ' + o.address.phone : '' }}</p>
          <p class="muted">TODD Market fee {{ o.platformFeeCents | money: true }}{{ o.commissionCents ? ' · referral commission ' + (o.commissionCents | money: true) : '' }}{{ o.refundedCents ? ' · refunded ' + (o.refundedCents | money: true) : '' }}</p>
          <div class="ful">
            <div class="seg">
              @for (s of statuses; track s.key) { <button type="button" [class.on]="o.fulfillment.status === s.key" [disabled]="busy() === o.id" (click)="set(o, s.key)">{{ s.label }}</button> }
            </div>
            <input class="tm-input track" placeholder="Tracking number" [ngModel]="o.fulfillment.tracking || ''" (change)="track(o, $any($event.target).value)">
          </div>
        </article>
      } @empty {
        @if (loaded()) { <p class="muted">No orders yet. They appear here as soon as a shopper checks out.</p> }
      }
      @if (error()) { <p class="tm-error" role="alert">{{ error() }}</p> }
    </section>`,
  styles: [`
    .wrap { display: flex; flex-direction: column; gap: 14px; max-width: 920px; }
    .returns { display: flex; flex-direction: column; gap: 8px; padding: 18px; border-radius: 20px; background: var(--t-yellow); color: var(--t-yellow-fg); }
    .returns h2 { font-size: 15px; font-weight: 700; }
    .ret { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 14px; border-radius: 16px; background: var(--bg); color: var(--text); font-size: 14px; flex-wrap: wrap; }
    .order { display: flex; flex-direction: column; gap: 8px; padding: 20px; border-radius: 20px; background: var(--surface); }
    .top { display: flex; justify-content: space-between; gap: 10px; }
    ul { list-style: none; margin: 0; padding: 0; font-size: 14px; display: flex; flex-direction: column; gap: 4px; }
    li { display: flex; align-items: center; gap: 8px; }
    .muted { font-size: 13px; color: var(--muted); line-height: 1.5; }
    .ful { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
    .seg { display: inline-flex; gap: 4px; padding: 4px; border-radius: 999px; background: var(--bg); }
    .seg button { border: 0; min-height: 0; padding: 8px 14px; border-radius: 999px; background: transparent; font: inherit; font-size: 14px; font-weight: 600; color: var(--muted); cursor: pointer; }
    .seg button.on { background: var(--blue); color: #fff; }
    .track { max-width: 240px; background: var(--bg); }
  `],
} )
export class OrdersComponent implements OnInit {
  private readonly merchant = inject( MerchantService );
  readonly orders = signal<MerchantOrder[]>( [] );
  readonly returns = signal<MerchantReturn[]>( [] );
  readonly loaded = signal( false );
  readonly busy = signal( '' );
  readonly error = signal( '' );
  readonly statuses = [
    { key: 'received', label: 'Received' }, { key: 'preparing', label: 'Preparing' }, { key: 'shipped', label: 'Shipped' }, { key: 'delivered', label: 'Delivered' },
  ];
  readonly openReturns = computed( () => this.returns().filter( ( r ) => r.status === 'requested' ) );
  readonly itemLabel = ( i: { title: string; quantity: number } ) => `${ i.title } × ${ i.quantity }`;

  async ngOnInit (): Promise<void> {
    try {
      const { orders, returns } = await this.merchant.orders();
      this.orders.set( orders );
      this.returns.set( returns );
    } catch ( error ) {
      this.error.set( apiErrorMessage( error, "We couldn't load your orders." ) );
    } finally {
      this.loaded.set( true );
    }
  }

  date ( ms: number ): string {
    return ms ? new Date( ms ).toLocaleDateString( 'en-US', { month: 'short', day: 'numeric' } ) : '';
  }

  async set ( order: MerchantOrder, status: string ): Promise<void> {
    if ( status === 'received' ) return;
    if ( status === 'delivered' && typeof window !== 'undefined' && !window.confirm( `Mark ${ order.id } delivered? The return window starts today.` ) ) return;
    await this.update( order, status, order.fulfillment.tracking || undefined );
  }

  async track ( order: MerchantOrder, tracking: string ): Promise<void> {
    await this.update( order, order.fulfillment.status === 'received' ? 'shipped' : order.fulfillment.status, tracking );
  }

  async receive ( r: MerchantReturn ): Promise<void> {
    this.busy.set( r.id );
    try {
      await this.merchant.receiveReturn( r.id );
      await this.ngOnInit();
    } catch ( error ) {
      this.error.set( apiErrorMessage( error ) );
    } finally {
      this.busy.set( '' );
    }
  }

  private async update ( order: MerchantOrder, status: string, tracking?: string ): Promise<void> {
    this.busy.set( order.id );
    this.error.set( '' );
    try {
      await this.merchant.setFulfillment( order.id, status, tracking );
      this.orders.update( ( list ) => list.map( ( o ) => o.id === order.id ? { ...o, fulfillment: { status, tracking: tracking ?? o.fulfillment.tracking } } : o ) );
    } catch ( error ) {
      this.error.set( apiErrorMessage( error ) );
    } finally {
      this.busy.set( '' );
    }
  }
}
