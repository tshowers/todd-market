import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { CheckoutService, OrderView } from '../../services/checkout.service';
import { apiErrorMessage } from '../../services/market-api.service';
import { MarketAuthService } from '../../services/market-auth.service';
import { SeoService } from '../../services/seo.service';
import { MoneyPipe } from '../../shared/money.pipe';

const STAGES = ['Received', 'Preparing', 'Shipped', 'Delivered'];
const STAGE_INDEX: Record<string, number> = { received: 0, preparing: 1, shipped: 2, delivered: 3 };

/** Order confirmation (f07, m17): one shipment card per store. */
@Component( {
  selector: 'tm-order-confirmation',
  standalone: true,
  imports: [RouterLink, MoneyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'tt-page' },
  template: `
    <main class="page">
      @if (order(); as o) {
        <div class="head"><span class="tm-dot"></span>Order {{ o.id }}</div>
        <h1>Thanks{{ firstName() ? ', ' + firstName() : '' }}. Your order is in.</h1>
        <p class="lead">We emailed a receipt to {{ o.email }}. Each store will email you when your items ship.</p>
        <div class="cards">
          @for (p of o.parts; track p.storeId; let i = $index) {
            <section class="ship">
              <div class="store"><span class="dot" [class.dot--network]="i > 0"></span>{{ p.storeName }}</div>
              <div class="eta">{{ eta(p.shippingRate?.minDays, p.shippingRate?.maxDays) }}</div>
              <ul>@for (it of p.items; track it.productId) { <li>{{ it.title }}{{ it.variantTitle ? ' · ' + it.variantTitle : '' }}{{ it.quantity > 1 ? ' × ' + it.quantity : '' }}</li> }</ul>
              <div class="bar">@for (s of stages; track s; let k = $index) { <span [class.on]="k <= stage(p.fulfillment?.status)"></span> }</div>
              <div class="status">{{ stages[stage(p.fulfillment?.status)] }}{{ p.fulfillment?.tracking ? ' · Tracking ' + p.fulfillment?.tracking : '' }}</div>
            </section>
          }
        </div>
        <div class="paid">
          <span>Paid {{ o.totalCents | money: true }}{{ o.card ? ' with ' + brand(o.card.brand) + ' ending ' + o.card.last4 : '' }}</span>
          @if (o.parts.length > 1) { <span>{{ o.parts.slice(1).map(storeOf).join(' and ') }} will email you about {{ o.parts.length > 2 ? 'their items' : 'its items' }}.</span> }
        </div>
        <div class="actions">
          @if (auth.isSignedIn()) { <a class="tm-btn tm-btn--primary tm-btn--lg" [routerLink]="['/account/orders', o.id]">View order</a> }
          <a class="tm-btn tm-btn--lg" [routerLink]="['/', o.parts[0].storeSlug]">Keep shopping</a>
        </div>
      } @else if (error()) {
        <p class="tm-error" role="alert">{{ error() }}</p>
      } @else {
        <p class="lead">Loading your order…</p>
      }
    </main>`,
  styles: [`
    .page { width: 100%; max-width: 920px; margin: 0 auto; padding: 48px 40px; display: flex; flex-direction: column; gap: 18px; flex: 1 0 auto; }
    .head { display: flex; align-items: center; gap: 10px; font-size: 14px; font-weight: 700; }
    h1 { font-size: 46px; font-weight: 700; letter-spacing: -0.03em; line-height: 1.02; }
    .lead { font-size: 17px; color: var(--muted); }
    .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(280px, 100%), 1fr)); gap: 14px; }
    .ship { display: flex; flex-direction: column; gap: 10px; padding: 22px; border-radius: 20px; background: var(--surface); }
    .store { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: var(--muted); }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--blue); }
    .dot--network { background: var(--cyan); }
    .eta { font-size: 20px; font-weight: 700; }
    ul { list-style: none; margin: 0; padding: 0; font-size: 14px; display: flex; flex-direction: column; gap: 2px; }
    .bar { display: grid; grid-template-columns: repeat(4, 1fr); gap: 4px; }
    .bar span { height: 6px; border-radius: 3px; background: var(--surface2); }
    .bar span.on { background: var(--blue); }
    .status { font-size: 13px; color: var(--muted); }
    .paid { display: flex; flex-direction: column; gap: 4px; padding: 16px 20px; border-radius: 16px; background: var(--surface); font-size: 14px; }
    .paid span:last-child:not(:first-child) { color: var(--muted); }
    .actions { display: flex; gap: 10px; flex-wrap: wrap; }
    @media (max-width: 600px) { .page { padding: 28px 18px; } h1 { font-size: 32px; } }
  `],
} )
export class OrderConfirmationComponent implements OnInit {
  private readonly route = inject( ActivatedRoute );
  private readonly checkout = inject( CheckoutService );
  readonly auth = inject( MarketAuthService );
  readonly order = signal<OrderView | null>( null );
  readonly error = signal( '' );
  readonly stages = STAGES;
  readonly firstName = computed( () => ( this.order()?.address?.name || '' ).split( ' ' )[0] );

  constructor () {
    inject( SeoService ).set( { title: 'Your order | TODD Market', description: 'Your order', path: '/order', noindex: true } );
  }

  async ngOnInit (): Promise<void> {
    const id = this.route.snapshot.paramMap.get( 'id' ) || '';
    await this.auth.ready;
    try {
      this.order.set( await this.checkout.order( id, this.route.snapshot.queryParamMap.get( 'token' ) || undefined ) );
    } catch ( error ) {
      this.error.set( apiErrorMessage( error, "We couldn't find that order." ) );
    }
  }

  stage ( status?: string ): number {
    return STAGE_INDEX[status || 'received'] ?? 0;
  }

  eta ( min?: number, max?: number ): string {
    if ( !max ) return 'Pickup or delivery soon';
    const fmt = ( d: number ) => new Date( Date.now() + d * 86400000 ).toLocaleDateString( 'en-US', { month: 'short', day: 'numeric' } );
    return min && min !== max ? `${ fmt( min ) }–${ fmt( max ).replace( /^[A-Za-z]+ /, '' ) }` : fmt( max );
  }

  brand ( value: string ): string {
    return ( { visa: 'Visa', mastercard: 'Mastercard', amex: 'Amex', discover: 'Discover' } as Record<string, string> )[value] || value;
  }

  readonly storeOf = ( p: { storeName: string } ) => p.storeName;
}
