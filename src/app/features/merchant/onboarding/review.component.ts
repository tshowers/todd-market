import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { ReviewData, Voice } from '../../../models/merchant.model';
import { apiErrorMessage } from '../../../services/market-api.service';
import { MerchantService, PricingProduct } from '../../../services/merchant.service';
import { StorePreviewComponent } from '../../../shared/store-preview/store-preview.component';
import { storeAddress } from '../../../shared/store-address';

/** 1.4 Review (d04): live preview, Voice, Collections, "Needs your eye", then "Next: get paid". */
@Component( {
  selector: 'tm-review',
  standalone: true,
  imports: [StorePreviewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './review.component.html',
  styleUrl: './review.component.css',
} )
export class ReviewComponent implements OnInit {
  private readonly merchant = inject( MerchantService );
  private readonly router = inject( Router );

  readonly data = signal<ReviewData | null>( null );
  readonly voice = signal<Voice>( 'warm' );
  readonly error = signal( '' );
  readonly busy = signal( false );
  /** "Add prices": the open no-price issue and its products. */
  readonly pricingIssue = signal( '' );
  readonly pricing = signal<PricingProduct[]>( [] );
  readonly voices: { key: Voice; label: string }[] = [
    { key: 'warm', label: 'Warm' }, { key: 'classic', label: 'Classic' }, { key: 'minimal', label: 'Minimal' },
  ];

  readonly heroLine = computed( () => this.data()?.store.heroLines[this.voice()] || '' );
  readonly liveCollections = computed( () => ( this.data()?.collections || [] ).filter( ( c ) => c.enabled ).slice( 0, 6 ).map( ( c ) => c.name ) );
  readonly openIssues = computed( () => ( this.data()?.issues || [] ).filter( ( i ) => !i.resolved ) );
  readonly address = computed( () => this.data() ? storeAddress( this.data()!.store.slug, this.data()!.store.customDomain ) : '' );

  async ngOnInit (): Promise<void> {
    try {
      const data = await this.merchant.review();
      this.data.set( data );
      this.voice.set( data.store.voice || 'warm' );
    } catch ( error ) {
      this.error.set( apiErrorMessage( error, "We couldn't load your store." ) );
    }
  }

  async setVoice ( voice: Voice ): Promise<void> {
    this.voice.set( voice );
    await this.merchant.update( { voice } ).catch( ( error ) => this.error.set( apiErrorMessage( error ) ) );
  }

  async toggle ( id: string ): Promise<void> {
    const current = this.data();
    if ( !current ) return;
    const collection = current.collections.find( ( c ) => c.id === id );
    if ( !collection ) return;
    const enabled = !collection.enabled;
    this.data.set( { ...current, collections: current.collections.map( ( c ) => c.id === id ? { ...c, enabled } : c ) } );
    await this.merchant.setCollection( id, enabled ).catch( ( error ) => this.error.set( apiErrorMessage( error ) ) );
  }

  async fix ( id: string ): Promise<void> {
    const current = this.data();
    if ( !current ) return;
    this.data.set( { ...current, issues: current.issues.map( ( i ) => i.id === id ? { ...i, resolved: true } : i ) } );
    await this.merchant.resolveIssue( id ).catch( ( error ) => this.error.set( apiErrorMessage( error ) ) );
  }

  async openPricing ( issueId: string ): Promise<void> {
    if ( this.pricingIssue() === issueId ) {
      this.pricingIssue.set( '' );
      return;
    }
    try {
      this.pricing.set( ( await this.merchant.issueProducts( issueId ) ).products.filter( ( p ) => !p.hidden ) );
      this.pricingIssue.set( issueId );
    } catch ( error ) {
      this.error.set( apiErrorMessage( error ) );
    }
  }

  async rename ( id: string, title: string ): Promise<void> {
    if ( !title.trim() ) return;
    await this.saveProduct( id, { title: title.trim() } );
  }

  async price ( id: string, value: string ): Promise<void> {
    const dollars = Number( String( value ).replace( /[$,\s]/g, '' ) );
    if ( !Number.isFinite( dollars ) || dollars <= 0 ) {
      this.error.set( 'Enter a price like 24.00.' );
      return;
    }
    await this.saveProduct( id, { priceCents: Math.round( dollars * 100 ) } );
  }

  private async saveProduct ( id: string, change: { title?: string; priceCents?: number } ): Promise<void> {
    this.error.set( '' );
    try {
      const saved = await this.merchant.updateProduct( id, change );
      this.pricing.update( ( list ) => list.map( ( p ) => p.id === id ? { ...p, title: saved.title, priceCents: saved.priceCents } : p ) );
      const left = this.pricing().filter( ( p ) => !p.priceCents ).length;
      const current = this.data();
      if ( current ) {
        const issueId = this.pricingIssue();
        this.data.set( { ...current, issues: current.issues.map( ( i ) => i.id !== issueId ? i : saved.issueResolved ? { ...i, resolved: true } : { ...i, message: `${ left } product${ left === 1 ? ' has' : 's have' } no price.` } ) } );
        if ( saved.issueResolved ) this.pricingIssue.set( '' );
      }
    } catch ( error ) {
      this.error.set( apiErrorMessage( error ) );
    }
  }

  async next (): Promise<void> {
    this.busy.set( true );
    try {
      await this.merchant.update( { onboardingStep: 'get-paid' } );
      await this.router.navigateByUrl( '/app/onboarding/get-paid' );
    } catch ( error ) {
      this.error.set( apiErrorMessage( error ) );
      this.busy.set( false );
    }
  }

  async startOver (): Promise<void> {
    if ( typeof window !== 'undefined' && !window.confirm( 'Start over? Your imported catalog and the AI changes are removed.' ) ) return;
    try {
      await this.merchant.startOver();
      await this.router.navigateByUrl( '/app/onboarding/import' );
    } catch ( error ) {
      this.error.set( apiErrorMessage( error ) );
    }
  }
}
