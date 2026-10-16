import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { MerchantStore } from '../../../models/merchant.model';
import { MerchantService } from '../../../services/merchant.service';
import { storeAddress } from '../../../shared/store-address';

/** 1.6 Live (d07, m03). */
@Component( {
  selector: 'tm-live',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (store(); as s) {
      <section class="wrap">
        <div class="live"><span class="tm-dot"></span>Live</div>
        <h1 class="tm-h1">{{ s.name }} is open.</h1>
        <div class="cards">
          <div class="card"><span class="tm-label">Store</span><a [routerLink]="['/s', s.slug]" class="url">{{ address() }}</a></div>
          <div class="card"><span class="tm-label">Shopping agents</span><span>{{ s.stats.productCount.toLocaleString() }} products, prices, stock and policies readable</span></div>
          <div class="card"><span class="tm-label">Network</span><span>{{ s.stats.networkCount }} nearby store{{ s.stats.networkCount === 1 ? '' : 's' }} can send you shoppers</span></div>
          <div class="card">
            <span class="tm-label">Payments</span>
            @if (s.stripe.payoutsEnabled) { <span>Taking orders. Payouts on.</span> }
            @else { <span>Taking orders. Payouts unlock after you verify.</span><a class="tm-btn tm-btn--ghost unlock" routerLink="/app/onboarding/get-paid">Unlock payouts</a> }
            @if (s.stripe.taxStatus !== 'active') { <a class="tax" routerLink="/app/settings/tax">Set up sales tax →</a> }
          </div>
        </div>
        <div class="actions">
          <a class="tm-btn tm-btn--primary go" [routerLink]="['/s', s.slug]">View storefront</a>
          <a class="tm-btn" routerLink="/app/dashboard">Referral settings</a>
        </div>
      </section>
    }`,
  styles: [`
    .wrap { display: flex; flex-direction: column; gap: 22px; }
    .live { display: flex; align-items: center; gap: 10px; font-size: 15px; font-weight: 700; }
    .cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(180px, 100%), 1fr)); gap: 12px; }
    .card { display: flex; flex-direction: column; gap: 8px; padding: 18px; border-radius: 16px; background: var(--surface); font-size: 15px; line-height: 1.45; }
    .url { overflow-wrap: anywhere; font-weight: 600; }
    .unlock { align-self: flex-start; padding: 0 10px; margin-left: -10px; }
    .tax { font-size: 13px; font-weight: 600; }
    .actions { display: flex; gap: 10px; flex-wrap: wrap; }
    .go { padding: 0 22px; font-size: 16px; }
  `],
} )
export class LiveComponent implements OnInit {
  private readonly merchant = inject( MerchantService );
  readonly store = signal<MerchantStore | null>( null );
  readonly address = computed( () => this.store() ? storeAddress( this.store()!.slug ) : '' );

  async ngOnInit (): Promise<void> {
    this.store.set( await this.merchant.load() );
  }
}
