import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { apiErrorMessage } from '../../../services/market-api.service';
import { ImportRequest, MerchantService } from '../../../services/merchant.service';

type Source = 'shopify' | 'salesforce' | 'csv' | 'files';

const MAX_CSV_BYTES = 6 * 1024 * 1024;

/** 1.1 Import (d01): pick a source, see what was found, then "Next: your brand". */
@Component( {
  selector: 'tm-import',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="wrap">
      <div><h1 class="tm-h1">Bring your catalog.</h1><p class="tm-lead">TODD Market reads it and builds your store. Nothing goes live until you approve it.</p></div>
      <div class="sources" role="radiogroup" aria-label="Where your catalog is">
        @for (s of sources; track s.key) {
          <button type="button" role="radio" class="source" [class.on]="source() === s.key" [attr.aria-checked]="source() === s.key" (click)="pick(s.key)">
            <span class="mark">{{ s.mark }}</span><span class="label">{{ s.label }}</span><span class="sub">{{ s.sub }}</span>
          </button>
        }
      </div>

      @switch (source()) {
        @case ('shopify') {
          <label class="field"><span class="tm-label">Shopify store URL</span>
            <input class="tm-input" placeholder="yourstore.myshopify.com" [ngModel]="shopifyUrl()" (ngModelChange)="shopifyUrl.set($event); found.set(null)" (blur)="previewShopify()" autocomplete="url"></label>
        }
        @case ('csv') {
          <label class="field"><span class="tm-label">CSV file</span>
            <span class="file"><input type="file" accept=".csv,text/csv" (change)="onCsv($event)"><span>{{ fileName() || 'Choose a CSV file (a Shopify export works)' }}</span></span></label>
          <label class="field"><span class="tm-label">Store name</span>
            <input class="tm-input" placeholder="Betty's Bridal" [ngModel]="storeName()" (ngModelChange)="storeName.set($event)"></label>
        }
        @case ('salesforce') {
          <p class="note">Salesforce Commerce imports need API access from your Salesforce admin. <a href="mailto:support@taliferro.tech?subject=TODD%20Market%20Salesforce%20import">Email us</a> and we'll set it up with you, or export a CSV for now.</p>
        }
        @case ('files') {
          <p class="note">Photos and price sheets are imported with our help for now. <a href="mailto:support@taliferro.tech?subject=TODD%20Market%20file%20import">Email them to us</a>, or put your products in a CSV (name, price, image, category, size, color, stock).</p>
        }
      }

      @if (error()) { <span class="tm-error" role="alert">{{ error() }}</span> }
      <div class="actions">
        <button type="button" class="tm-btn tm-btn--primary next" [disabled]="!canContinue() || busy()" (click)="next()">{{ busy() ? 'Reading your catalog…' : 'Next: your brand' }}</button>
        @if (found(); as f) { <span class="meta">{{ f.productCount.toLocaleString() }} products found{{ f.unpriced ? ' · ' + f.unpriced + ' without a price' : '' }}</span> }
        @else if (checking()) { <span class="meta">Checking…</span> }
      </div>
    </section>`,
  styles: [`
    .wrap { display: flex; flex-direction: column; gap: 26px; max-width: 760px; }
    .sources { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(160px, 100%), 1fr)); gap: 12px; }
    .source { cursor: pointer; font: inherit; text-align: left; display: flex; flex-direction: column; gap: 10px; padding: 18px; min-height: 0;
      border-radius: 16px; background: var(--surface); border: 2px solid transparent; color: var(--text); }
    .source.on { background: var(--t-blue); border-color: var(--blue); }
    .mark { width: 36px; height: 36px; border-radius: 50%; background: var(--bg); display: grid; place-items: center; font-weight: 700; letter-spacing: -0.02em; font-size: 16px; }
    .label { font-weight: 700; font-size: 15px; }
    .sub { font-size: 13px; color: var(--muted); }
    .field { display: flex; flex-direction: column; gap: 6px; max-width: 460px; }
    .file { position: relative; display: flex; align-items: center; height: 48px; padding: 0 18px; border-radius: 999px; background: var(--surface); font-size: 15px; color: var(--muted); }
    .file input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
    .note { max-width: 560px; font-size: 15px; line-height: 1.5; color: var(--muted); }
    .actions { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; }
    .next { padding: 0 22px; font-size: 16px; }
    .meta { font-size: 13px; color: var(--muted); }
  `],
} )
export class ImportComponent implements OnInit {
  private readonly merchant = inject( MerchantService );
  private readonly router = inject( Router );

  readonly sources: { key: Source; mark: string; label: string; sub: string }[] = [
    { key: 'shopify', mark: 'S', label: 'Shopify', sub: 'Your store address' },
    { key: 'salesforce', mark: 'SF', label: 'Salesforce Commerce', sub: 'With your admin' },
    { key: 'csv', mark: 'CSV', label: 'CSV file', sub: 'Any spreadsheet export' },
    { key: 'files', mark: '↑', label: 'Upload files', sub: 'Photos and price sheets' },
  ];

  readonly source = signal<Source>( 'shopify' );
  readonly shopifyUrl = signal( '' );
  readonly csvText = signal( '' );
  readonly fileName = signal( '' );
  readonly storeName = signal( '' );
  readonly found = signal<{ name: string; productCount: number; unpriced: number } | null>( null );
  readonly checking = signal( false );
  readonly busy = signal( false );
  readonly error = signal( '' );

  readonly canContinue = computed( () => {
    if ( this.source() === 'shopify' ) return this.shopifyUrl().trim().length > 3;
    if ( this.source() === 'csv' ) return !!this.csvText() && this.storeName().trim().length > 0;
    return false;
  } );

  async ngOnInit (): Promise<void> {
    const store = await this.merchant.current().catch( () => null );
    if ( store?.name ) this.storeName.set( store.name );
  }

  pick ( source: Source ): void {
    this.source.set( source );
    this.found.set( null );
    this.error.set( '' );
  }

  async previewShopify (): Promise<void> {
    if ( !this.shopifyUrl().trim() ) return;
    await this.runPreview( { source: 'shopify', shopifyUrl: this.shopifyUrl() } );
  }

  onCsv ( event: Event ): void {
    const file = ( event.target as HTMLInputElement ).files?.[0];
    if ( !file ) return;
    this.error.set( '' );
    if ( file.size > MAX_CSV_BYTES ) {
      this.error.set( 'That file is over 6 MB. Split it into smaller files, or email it to us.' );
      return;
    }
    this.fileName.set( file.name );
    const reader = new FileReader();
    reader.onload = () => {
      this.csvText.set( String( reader.result || '' ) );
      void this.runPreview( { source: 'csv', csvText: this.csvText(), fileName: file.name } );
    };
    reader.readAsText( file );
  }

  async next (): Promise<void> {
    const request: ImportRequest = this.source() === 'shopify'
      ? { source: 'shopify', shopifyUrl: this.shopifyUrl(), storeName: this.found()?.name }
      : { source: 'csv', csvText: this.csvText(), fileName: this.fileName(), storeName: this.storeName() };
    this.busy.set( true );
    this.error.set( '' );
    try {
      await this.merchant.import( request );
      await this.router.navigateByUrl( '/app/onboarding/brand' );
    } catch ( error ) {
      this.error.set( apiErrorMessage( error, "We couldn't read that catalog. Check it and try again." ) );
    } finally {
      this.busy.set( false );
    }
  }

  private async runPreview ( request: ImportRequest ): Promise<void> {
    this.checking.set( true );
    this.error.set( '' );
    try {
      const found = await this.merchant.preview( request );
      this.found.set( found );
      if ( request.source === 'shopify' && found.name && !this.storeName() ) this.storeName.set( found.name );
    } catch ( error ) {
      this.found.set( null );
      this.error.set( apiErrorMessage( error, "We couldn't read that catalog." ) );
    } finally {
      this.checking.set( false );
    }
  }
}
