import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { AccountOrder, AccountService } from '../../services/account.service';
import { apiErrorMessage } from '../../services/market-api.service';
import { MoneyPipe } from '../../shared/money.pipe';

/** Account → Orders (f08). */
@Component( {
  selector: 'tm-orders-list',
  standalone: true,
  imports: [RouterLink, MoneyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1>Orders</h1>
    @for (o of orders(); track o.id) {
      <a class="row" [routerLink]="['/account/orders', o.id]">
        @if (o.image) { <img [src]="o.image" alt=""> } @else { <span class="ph"></span> }
        <span class="what"><strong>{{ o.id }} · {{ date(o.paidAt) }}</strong><span>{{ o.stores.join(' · ') }}</span></span>
        <strong class="total">{{ o.totalCents | money: true }}</strong>
        <span class="tm-tag" [class.tm-tint-blue]="o.status === 'in_progress'" [class.tm-tint-green]="o.status === 'delivered'" [class.tm-tint-violet]="o.status === 'refunded'">{{ label(o.status) }}</span>
      </a>
    } @empty {
      @if (loaded()) { <p class="muted">No orders yet. Orders you place at any TODD Market store show up here.</p> }
    }
    @if (error()) { <p class="tm-error">{{ error() }}</p> }`,
  styles: [`
    :host { display: flex; flex-direction: column; gap: 10px; }
    h1 { font-size: 32px; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 6px; }
    .row { display: grid; grid-template-columns: 48px minmax(0, 1fr) auto auto; gap: 14px; align-items: center; padding: 14px 16px; border-radius: 20px; background: var(--surface); color: var(--text); }
    .row:hover { background: var(--surface2); color: var(--text); }
    .row img, .ph { width: 48px; height: 48px; border-radius: 12px; object-fit: cover; background: var(--surface2); }
    .what { display: flex; flex-direction: column; min-width: 0; font-size: 14px; }
    .what span { color: var(--muted); font-size: 13px; }
    .total { font-size: 15px; }
    .muted { color: var(--muted); font-size: 14px; }
    @media (max-width: 600px) { .row { grid-template-columns: 48px minmax(0, 1fr) auto; } .row .tm-tag { grid-column: 2 / -1; } }
  `],
} )
export class OrdersListComponent implements OnInit {
  private readonly account = inject( AccountService );
  readonly orders = signal<AccountOrder[]>( [] );
  readonly loaded = signal( false );
  readonly error = signal( '' );

  async ngOnInit (): Promise<void> {
    try {
      this.orders.set( ( await this.account.orders() ).orders );
    } catch ( error ) {
      this.error.set( apiErrorMessage( error, "We couldn't load your orders." ) );
    } finally {
      this.loaded.set( true );
    }
  }

  date ( ms: number ): string {
    return ms ? new Date( ms ).toLocaleDateString( 'en-US', { month: 'short', day: 'numeric', year: 'numeric' } ) : '';
  }

  label ( status: string ): string {
    return ( { in_progress: 'In progress', delivered: 'Delivered', refunded: 'Refunded' } as Record<string, string> )[status] || status;
  }
}
