import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { MerchantStore, ReviewData } from '../../../models/merchant.model';
import { apiErrorMessage } from '../../../services/market-api.service';
import { MerchantService } from '../../../services/merchant.service';
import { IconComponent } from '../../../shared/icon/icon.component';
import { storeAddress } from '../../../shared/store-address';
import { StorePreviewComponent } from '../../../shared/store-preview/store-preview.component';

/**
 * 1.5 Get paid (d05, d06, m02). Two Stripe-hosted phases: "Start accepting
 * payments" (needed to go live) and "Unlock payouts" (before the first
 * payout). States come from the account's charges_enabled / payouts_enabled.
 */
@Component( {
  selector: 'tm-get-paid',
  standalone: true,
  imports: [StorePreviewComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './get-paid.component.html',
  styleUrl: './get-paid.component.css',
} )
export class GetPaidComponent implements OnInit {
  private readonly merchant = inject( MerchantService );
  private readonly route = inject( ActivatedRoute );
  private readonly router = inject( Router );

  readonly store = signal<MerchantStore | null>( null );
  readonly review = signal<ReviewData | null>( null );
  /** "Finishing up with Stripe…" / "Checking your ID…" while we re-read the account after a return. */
  readonly syncing = signal<'accept' | 'payouts' | null>( null );
  readonly opening = signal( false );
  readonly busy = signal( false );
  readonly error = signal( '' );

  readonly accepting = computed( () => !!this.store()?.stripe.chargesEnabled );
  readonly payouts = computed( () => !!this.store()?.stripe.payoutsEnabled );
  /** Back from the payouts phase, but Stripe is still verifying. */
  readonly checkingId = computed( () => this.accepting() && !this.payouts() && this.route.snapshot.queryParamMap.get( 'phase' ) === 'payouts' );
  readonly heroLine = computed( () => {
    const s = this.store();
    return s ? s.heroLines[s.voice] || '' : '';
  } );
  readonly collections = computed( () => ( this.review()?.collections || [] ).filter( ( c ) => c.enabled ).slice( 0, 6 ).map( ( c ) => c.name ) );
  readonly address = computed( () => this.store() ? storeAddress( this.store()!.slug ) : '' );

  async ngOnInit (): Promise<void> {
    const params = this.route.snapshot.queryParamMap;
    const phase = params.get( 'phase' ) === 'payouts' ? 'payouts' : 'accept';
    try {
      this.review.set( await this.merchant.review() );
      this.store.set( this.review()!.store );
      if ( params.get( 'stripe' ) === 'return' || this.store()?.stripe.connected ) {
        this.syncing.set( params.get( 'stripe' ) === 'return' ? phase : null );
        this.store.set( await this.merchant.syncStripe() );
      }
    } catch ( error ) {
      this.error.set( apiErrorMessage( error, "We couldn't reach Stripe. Try again." ) );
    } finally {
      this.syncing.set( null );
    }
    // The link expired or was reused: make a fresh one and go straight back.
    if ( params.get( 'stripe' ) === 'refresh' ) await this.openStripe( phase );
  }

  async openStripe ( phase: 'accept' | 'payouts' ): Promise<void> {
    this.opening.set( true );
    this.error.set( '' );
    try {
      const url = await this.merchant.stripeLink( phase );
      window.location.assign( url );
    } catch ( error ) {
      this.error.set( apiErrorMessage( error, "We couldn't open Stripe. Try again." ) );
      this.opening.set( false );
    }
  }

  async goLive (): Promise<void> {
    this.busy.set( true );
    this.error.set( '' );
    try {
      await this.merchant.goLive();
      await this.router.navigateByUrl( '/app/onboarding/live' );
    } catch ( error ) {
      this.error.set( apiErrorMessage( error ) );
      this.busy.set( false );
    }
  }

  back (): void {
    void this.router.navigateByUrl( '/app/onboarding/review' );
  }
}
