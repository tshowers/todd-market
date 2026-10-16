import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { Palette } from '../../../models/merchant.model';
import { apiErrorMessage } from '../../../services/market-api.service';
import { MerchantService } from '../../../services/merchant.service';
import { tuneBrand } from '../../../shared/brand/brand-tuning';

const DEFAULT_PALETTE: Palette = { main: '#c9849a', accent: '#4a2340', background: '#efe3d3' };
const MAX_LOGO_BYTES = 1024 * 1024;

/** 1.2 Brand (d02, m01): logo, colours, "Tuned for Find", light and dark samples, then "Build my store". */
@Component( {
  selector: 'tm-brand',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './brand.component.html',
  styleUrl: './brand.component.css',
} )
export class BrandComponent implements OnInit {
  private readonly merchant = inject( MerchantService );
  private readonly router = inject( Router );

  readonly storeName = signal( '' );
  readonly fromTheme = signal( false );
  readonly palette = signal<Palette>( DEFAULT_PALETTE );
  readonly logoUrl = signal<string | null>( null );
  private logoDataUrl: string | null = null;
  readonly busy = signal( false );
  readonly error = signal( '' );

  readonly tuned = computed( () => tuneBrand( this.palette() ) );
  readonly initial = computed( () => ( this.storeName() || 'S' ).charAt( 0 ).toUpperCase() );
  readonly swatches = computed( () => {
    const t = this.tuned();
    return [
      { label: 'Buttons', hex: t.accent },
      { label: 'Tags', hex: t.tintLight },
      { label: 'Tag text', hex: t.tintFgLight },
      { label: 'Dark tags', hex: t.tintDark },
    ];
  } );
  readonly paletteRows = computed( () => {
    const p = this.palette();
    return [
      { key: 'main' as const, label: 'Main', hex: p.main },
      { key: 'accent' as const, label: 'Accent', hex: p.accent },
      { key: 'background' as const, label: 'Background', hex: p.background },
    ];
  } );

  async ngOnInit (): Promise<void> {
    const store = await this.merchant.current().catch( () => null );
    if ( !store ) {
      await this.router.navigateByUrl( '/app/onboarding/import' );
      return;
    }
    this.storeName.set( store.name );
    this.palette.set( { ...DEFAULT_PALETTE, ...store.brand?.palette } );
    this.logoUrl.set( store.brand?.logoUrl ?? null );
    this.fromTheme.set( store.source === 'shopify' && store.brand?.palette?.main !== DEFAULT_PALETTE.main );
  }

  setColor ( key: keyof Palette, event: Event ): void {
    const hex = ( event.target as HTMLInputElement ).value.toLowerCase();
    this.palette.update( ( p ) => ( { ...p, [key]: hex } ) );
  }

  onLogo ( event: Event ): void {
    const file = ( event.target as HTMLInputElement ).files?.[0];
    if ( !file ) return;
    this.error.set( '' );
    if ( !/^image\/(png|jpeg|webp|svg\+xml)$/.test( file.type ) ) {
      this.error.set( 'Use a PNG, JPG, WebP or SVG file.' );
      return;
    }
    if ( file.size > MAX_LOGO_BYTES ) {
      this.error.set( 'That logo is over 1 MB. Use a smaller file.' );
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      this.logoDataUrl = String( reader.result || '' );
      this.logoUrl.set( this.logoDataUrl );
    };
    reader.readAsDataURL( file );
  }

  async build (): Promise<void> {
    this.busy.set( true );
    this.error.set( '' );
    try {
      await this.merchant.saveBrand( { palette: this.palette(), ...( this.logoDataUrl ? { logoDataUrl: this.logoDataUrl } : {} ) } );
      const { jobId } = await this.merchant.startBuild();
      await this.router.navigate( ['/app/onboarding/build'], { queryParams: { job: jobId } } );
    } catch ( error ) {
      this.error.set( apiErrorMessage( error, "We couldn't start the build. Try again." ) );
      this.busy.set( false );
    }
  }
}
