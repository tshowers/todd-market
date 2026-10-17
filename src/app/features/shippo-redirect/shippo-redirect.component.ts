import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { apiErrorMessage } from '../../services/market-api.service';
import { MerchantService } from '../../services/merchant.service';

/** Shippo sends the merchant back here after they approve TODD Market (callback /shippo-oauth-redirect/). */
@Component( {
  selector: 'tm-shippo-redirect',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'tt-page' },
  template: `
    <main class="page">
      @if (error()) {
        <h1>Shippo didn't connect.</h1>
        <p class="tm-error">{{ error() }}</p>
        <a class="tm-btn" routerLink="/app/settings/returns">Back to Returns settings</a>
      } @else {
        <p class="muted"><span class="tm-dot tm-dot--pulse"></span> Connecting Shippo…</p>
      }
    </main>`,
  styles: [`.page { max-width: 560px; margin: 0 auto; padding: 48px 24px; display: flex; flex-direction: column; gap: 14px; } h1 { font-size: 32px; font-weight: 700; } .muted { color: var(--muted); }`],
} )
export class ShippoRedirectComponent implements OnInit {
  private readonly route = inject( ActivatedRoute );
  private readonly router = inject( Router );
  private readonly merchant = inject( MerchantService );
  readonly error = signal( '' );

  async ngOnInit (): Promise<void> {
    const q = this.route.snapshot.queryParamMap;
    if ( q.get( 'error' ) ) {
      this.error.set( q.get( 'error_description' ) || 'You cancelled, or Shippo said no.' );
      return;
    }
    try {
      await this.merchant.finishShippo( q.get( 'code' ) || '', q.get( 'state' ) || '' );
      await this.router.navigateByUrl( '/app/settings/returns' );
    } catch ( error ) {
      this.error.set( apiErrorMessage( error, "Shippo didn't connect. Try again." ) );
    }
  }
}
