import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { apiErrorMessage } from '../../services/market-api.service';
import { MerchantService } from '../../services/merchant.service';
import { SeoService } from '../../services/seo.service';
import { ShopService } from '../../services/shop.service';
import { PublicHeaderComponent } from '../../shared/public-header/public-header.component';

type Method = 'email' | 'dns' | 'meta';

/**
 * "Is this your business?" (seeding plan, phase 3): the owner of a listed
 * shop claims it (a draft store with its interest history) or removes it
 * for good, after proving they control the shop's own domain.
 */
@Component( {
  selector: 'tm-claim',
  standalone: true,
  imports: [FormsModule, RouterLink, PublicHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'tt-page' },
  templateUrl: './claim.component.html',
  styleUrl: './claim.component.css',
} )
export class ClaimComponent implements OnInit {
  private readonly route = inject( ActivatedRoute );
  private readonly router = inject( Router );
  private readonly shop = inject( ShopService );
  private readonly merchant = inject( MerchantService );

  readonly listing = signal<{ domain: string; name: string; url: string; category: string; status: string; interestCount: number; products: { title: string; imageUrl: string }[] } | null>( null );
  readonly intent = signal<'claim' | 'remove' | null>( null );
  readonly started = signal<{ dns: { type: string; name: string; value: string }; meta: string } | null>( null );
  readonly method = signal<Method>( 'email' );
  readonly localPart = signal( '' );
  readonly sentTo = signal( '' );
  readonly code = signal( '' );
  readonly verified = signal( false );
  readonly removed = signal( false );
  readonly busy = signal( false );
  readonly error = signal( '' );

  constructor () {
    inject( SeoService ).set( { title: 'Claim your shop | 16Ahead Store', description: 'Claim or remove your shop on 16Ahead Store.', path: '/claim', noindex: true } );
  }

  async ngOnInit (): Promise<void> {
    try {
      this.listing.set( await this.shop.listing( this.route.snapshot.paramMap.get( 'domain' ) || '' ) );
    } catch ( error ) {
      this.error.set( apiErrorMessage( error, "That listing isn't available." ) );
    }
  }

  async choose ( intent: 'claim' | 'remove' ): Promise<void> {
    await this.run( async () => {
      this.started.set( await this.shop.startClaim( this.listing()!.domain, intent ) );
      this.intent.set( intent );
    } );
  }

  async sendCode (): Promise<void> {
    await this.run( async () => this.sentTo.set( ( await this.shop.sendClaimCode( this.listing()!.domain, this.localPart() ) ).sentTo ) );
  }

  async verify (): Promise<void> {
    await this.run( async () => {
      await this.shop.verifyClaim( this.listing()!.domain, this.method(), this.code() );
      this.verified.set( true );
    } );
  }

  async complete (): Promise<void> {
    await this.run( async () => {
      const result = await this.shop.completeClaim( this.listing()!.domain );
      if ( result.removed ) {
        this.removed.set( true );
        return;
      }
      await this.merchant.load();
      await this.router.navigateByUrl( '/app/onboarding/import' );
    } );
  }

  copy ( text: string ): void {
    void navigator.clipboard?.writeText( text );
  }

  private async run ( fn: () => Promise<void> ): Promise<void> {
    this.busy.set( true );
    this.error.set( '' );
    try {
      await fn();
    } catch ( error ) {
      this.error.set( apiErrorMessage( error ) );
    } finally {
      this.busy.set( false );
    }
  }
}
