import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AccountService, OrderDetail } from '../../services/account.service';
import { apiErrorMessage } from '../../services/market-api.service';
import { MoneyPipe } from '../../shared/money.pipe';

/** Account → order detail (f09): one card per store, returns where allowed. */
@Component( {
  selector: 'tm-order-detail',
  standalone: true,
  imports: [RouterLink, MoneyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a routerLink="/account" class="back">← All orders</a>
    @if (order(); as o) {
      <h1>{{ o.id }}</h1>
      <p class="muted">{{ date(o.paidAt) }} · {{ o.totalCents | money: true }}{{ o.card ? ' · ' + o.card.brand + ' ending ' + o.card.last4 : '' }}</p>
      @for (p of o.parts; track p.storeId) {
        <section class="card">
          <div class="top"><strong>{{ p.storeName }}</strong>
            <span class="tm-tag" [class.tm-tint-green]="p.fulfillment?.status === 'delivered'" [class.tm-tint-blue]="p.fulfillment?.status !== 'delivered'">{{ statusLabel(p.fulfillment?.status) }}</span></div>
          @for (i of p.items; track $index) {
            <div class="item">@if (i.image) { <img [src]="i.image" alt=""> } @else { <span class="ph"></span> }
              <span>{{ i.title }}{{ i.variantTitle ? ' · ' + i.variantTitle : '' }}{{ i.quantity > 1 ? ' × ' + i.quantity : '' }}</span><strong>{{ i.priceCents * i.quantity | money: true }}</strong></div>
          }
          <p class="note">
            @if (p.refundedCents) { Refunded {{ p.refundedCents | money: true }}. }
            @if (p.returnableUntil && p.returnableItems.length) { Returnable until {{ date(p.returnableUntil) }}. }
            @else if (p.fulfillment?.status !== 'delivered') { Returns open once it's delivered. }
            @if (p.referred) { Returns go to {{ p.storeName }} under their policy. }
          </p>
          <div class="actions">
            @if (p.returnableItems.length) { <a class="tm-btn tm-btn--primary" [routerLink]="['/account/orders', o.id, 'return']" [queryParams]="{ store: p.storeId }">Return an item</a> }
            @if (p.fulfillment?.tracking) { <span class="tm-btn">Tracking {{ p.fulfillment?.tracking }}</span> }
          </div>
        </section>
      }
    } @else if (error()) { <p class="tm-error">{{ error() }}</p> }`,
  styles: [`
    :host { display: flex; flex-direction: column; gap: 12px; }
    .back { font-size: 14px; font-weight: 600; }
    h1 { font-size: 32px; font-weight: 700; letter-spacing: -0.02em; }
    .muted { color: var(--muted); font-size: 14px; }
    .card { display: flex; flex-direction: column; gap: 10px; padding: 20px; border-radius: 20px; background: var(--surface); }
    .top { display: flex; justify-content: space-between; align-items: center; }
    .item { display: grid; grid-template-columns: 52px 1fr auto; gap: 12px; align-items: center; font-size: 14px; }
    .item img, .ph { width: 52px; height: 52px; border-radius: 12px; object-fit: cover; background: var(--surface2); }
    .note { font-size: 13px; color: var(--muted); }
    .actions { display: flex; gap: 10px; flex-wrap: wrap; }
  `],
} )
export class OrderDetailComponent implements OnInit {
  private readonly route = inject( ActivatedRoute );
  private readonly account = inject( AccountService );
  readonly order = signal<OrderDetail | null>( null );
  readonly error = signal( '' );

  async ngOnInit (): Promise<void> {
    try {
      this.order.set( await this.account.order( this.route.snapshot.paramMap.get( 'id' ) || '' ) );
    } catch ( error ) {
      this.error.set( apiErrorMessage( error, "We couldn't find that order." ) );
    }
  }

  date ( ms: number | null ): string {
    return ms ? new Date( ms ).toLocaleDateString( 'en-US', { month: 'short', day: 'numeric' } ) : '';
  }

  statusLabel ( s?: string ): string {
    return ( { received: 'Received', preparing: 'Preparing', shipped: 'Shipped', delivered: 'Delivered' } as Record<string, string> )[s || 'received'];
  }
}
