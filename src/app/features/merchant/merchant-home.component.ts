import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { apiErrorMessage } from '../../services/market-api.service';
import { MerchantService } from '../../services/merchant.service';

/** /app: sends the merchant to where they left off (onboarding step, or the dashboard once live). */
@Component( {
  selector: 'tm-merchant-home',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `@if (error()) { <p class="tm-error" role="alert">{{ error() }}</p> } @else { <p class="loading">Opening your store…</p> }`,
  styles: ['.loading { color: var(--muted); }'],
} )
export class MerchantHomeComponent implements OnInit {
  private readonly merchant = inject( MerchantService );
  private readonly router = inject( Router );
  readonly error = signal( '' );

  async ngOnInit (): Promise<void> {
    try {
      const store = await this.merchant.load();
      if ( !store ) await this.router.navigateByUrl( '/app/onboarding/import', { replaceUrl: true } );
      else if ( store.status === 'live' ) await this.router.navigateByUrl( '/app/dashboard', { replaceUrl: true } );
      else await this.router.navigateByUrl( `/app/onboarding/${ store.onboardingStep || 'import' }`, { replaceUrl: true } );
    } catch ( error ) {
      this.error.set( apiErrorMessage( error, "We couldn't open your store. Refresh to try again." ) );
    }
  }
}
