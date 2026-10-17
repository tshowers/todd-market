import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { apiErrorMessage } from '../../../services/market-api.service';
import { ImportRequest, MerchantService, SalesforceCredentials } from '../../../services/merchant.service';

type Source = 'shopify' | 'salesforce' | 'csv' | 'files';

const MAX_CSV_BYTES = 6 * 1024 * 1024;
const MAX_PDF_BYTES = 10 * 1024 * 1024;
const MAX_PHOTOS = 60;
const MAX_PDFS = 5;
const PHOTO_EDGE = 1600;

interface UploadItem { key: string; name: string; kind: 'photo' | 'pdf'; status: 'uploading' | 'done' | 'failed'; id?: string; preview?: string; error?: string }

/** 1.1 Import (d01): pick a source, see what was found, then "Next: your brand". */
@Component( {
  selector: 'tm-import',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="wrap">
      @if (claimed(); as c) {
        <div class="claimed tm-tint-green">Welcome, {{ storeName() }}.@if (c.interestCount) { {{ c.interestCount }} shopper{{ c.interestCount === 1 ? '' : 's' }} already asked to buy from you here, and we'll tell the ones who asked to know when you go live. }</div>
      }
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
          <p class="note">For Salesforce B2C Commerce. Ask your admin for a SLAS private client with the <code>sfcc.shopper-product-search</code> and <code>sfcc.shopper-products</code> scopes. The settings are in Business Manager under Administration → Salesforce Commerce API Settings. We use the secret once to read your catalog and never save it.</p>
          <div class="sf">
            <label class="field"><span class="tm-label">Short code</span><input class="tm-input" placeholder="kv7kzm78" autocomplete="off" [ngModel]="sf.shortCode" (ngModelChange)="setSf('shortCode', $event)"></label>
            <label class="field"><span class="tm-label">Organization ID</span><input class="tm-input" placeholder="f_ecom_abcd_prd" autocomplete="off" [ngModel]="sf.organizationId" (ngModelChange)="setSf('organizationId', $event)"></label>
            <label class="field"><span class="tm-label">Site ID</span><input class="tm-input" placeholder="RefArch" autocomplete="off" [ngModel]="sf.siteId" (ngModelChange)="setSf('siteId', $event)"></label>
            <label class="field"><span class="tm-label">Top category ID</span><input class="tm-input" placeholder="root" autocomplete="off" [ngModel]="sf.categoryId" (ngModelChange)="setSf('categoryId', $event)"></label>
            <label class="field"><span class="tm-label">SLAS client ID</span><input class="tm-input" autocomplete="off" [ngModel]="sf.clientId" (ngModelChange)="setSf('clientId', $event)"></label>
            <label class="field"><span class="tm-label">Client secret</span><input class="tm-input" type="password" autocomplete="off" [ngModel]="sf.clientSecret" (ngModelChange)="setSf('clientSecret', $event)"></label>
          </div>
          <div class="row"><button type="button" class="tm-btn" [disabled]="checking() || !sfComplete()" (click)="previewSalesforce()">{{ checking() ? 'Reading your catalog…' : 'Find my products' }}</button></div>
          <label class="field"><span class="tm-label">Store name</span>
            <input class="tm-input" placeholder="Betty's Bridal" [ngModel]="storeName()" (ngModelChange)="storeName.set($event)"></label>
        }
        @case ('files') {
          <label class="drop">
            <input type="file" multiple accept="image/jpeg,image/png,image/webp,image/heic,image/heif,application/pdf" (change)="onFiles($event)">
            <strong>Add product photos or PDF catalogs</strong>
            <span>One product per photo works best; photos of the same item are grouped. We name and describe each one, and you add prices in Review. Up to 60 photos and 5 PDFs.</span>
          </label>
          @if (uploads().length) {
            <ul class="uploads">
              @for (u of uploads(); track u.key) {
                <li [class.failed]="u.status === 'failed'">
                  @if (u.preview) { <img [src]="u.preview" alt=""> } @else { <span class="pdf">PDF</span> }
                  <span class="u-name">{{ u.name }}</span>
                  <span class="u-state">{{ u.status === 'uploading' ? 'Uploading…' : u.status === 'failed' ? u.error : '' }}</span>
                  <button type="button" class="x" [attr.aria-label]="'Remove ' + u.name" (click)="removeUpload(u.key)">×</button>
                </li>
              }
            </ul>
          }
          <label class="field"><span class="tm-label">Store name</span>
            <input class="tm-input" placeholder="Betty's Bridal" [ngModel]="storeName()" (ngModelChange)="storeName.set($event)"></label>
        }
      }

      @if (error()) { <span class="tm-error" role="alert">{{ error() }}</span> }
      <div class="actions">
        <button type="button" class="tm-btn tm-btn--primary next" [disabled]="!canContinue() || busy()" (click)="next()">{{ busy() ? 'Reading your catalog…' : 'Next: your brand' }}</button>
        @if (source() === 'files') { @if (uploadSummary()) { <span class="meta">{{ uploadSummary() }} ready. We read them while you set up your brand.</span> } }
        @else {
          @if (found(); as f) { <span class="meta">{{ f.productCount.toLocaleString() }} products found{{ f.unpriced ? ' · ' + f.unpriced + ' without a price' : '' }}</span> }
          @else if (checking()) { <span class="meta">Checking…</span> }
        }
      </div>
    </section>`,
  styles: [`
    .wrap { display: flex; flex-direction: column; gap: 26px; max-width: 760px; }
    .claimed { padding: 14px 18px; border-radius: 16px; font-size: 15px; line-height: 1.45; }
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
    .sf { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr)); gap: 12px; max-width: 560px; }
    .note code { font-size: 13px; }
    .row { display: flex; gap: 10px; }
    .drop { position: relative; display: flex; flex-direction: column; gap: 6px; padding: 22px; border-radius: 20px; background: var(--surface); border: 2px dashed var(--surface2); cursor: pointer; }
    .drop input { position: absolute; inset: 0; opacity: 0; cursor: pointer; }
    .drop strong { font-size: 16px; }
    .drop span { font-size: 14px; line-height: 1.45; color: var(--muted); }
    .uploads { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(min(150px, 100%), 1fr)); gap: 10px; }
    .uploads li { position: relative; display: flex; flex-direction: column; gap: 4px; padding: 8px; border-radius: 16px; background: var(--surface); font-size: 12px; }
    .uploads li.failed { box-shadow: 0 0 0 2px var(--red, #d33) inset; }
    .uploads img, .uploads .pdf { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 10px; background: var(--bg); display: grid; place-items: center; font-weight: 700; color: var(--muted); }
    .u-name { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 600; }
    .u-state { color: var(--muted); min-height: 1em; }
    .x { position: absolute; top: 12px; right: 12px; width: 28px; height: 28px; min-height: 0; padding: 0; border: 0; border-radius: 50%; background: var(--bg); color: var(--text); font-size: 18px; line-height: 1; cursor: pointer; }
  `],
} )
export class ImportComponent implements OnInit {
  private readonly merchant = inject( MerchantService );
  private readonly router = inject( Router );

  readonly sources: { key: Source; mark: string; label: string; sub: string }[] = [
    { key: 'shopify', mark: 'S', label: 'Shopify', sub: 'Your store address' },
    { key: 'salesforce', mark: 'SF', label: 'Salesforce Commerce', sub: 'With your admin' },
    { key: 'csv', mark: 'CSV', label: 'CSV file', sub: 'Any spreadsheet export' },
    { key: 'files', mark: '↑', label: 'Upload files', sub: 'Photos and PDF catalogs' },
  ];

  readonly source = signal<Source>( 'shopify' );
  readonly shopifyUrl = signal( '' );
  readonly csvText = signal( '' );
  readonly fileName = signal( '' );
  readonly storeName = signal( '' );
  /** A claimed listing: its address and how many shoppers asked for it. */
  readonly claimed = signal<{ domain: string; interestCount: number } | null>( null );
  readonly found = signal<{ name: string; productCount: number; unpriced: number } | null>( null );
  readonly uploads = signal<UploadItem[]>( [] );
  /** Salesforce Commerce credentials: sent with the read, never stored. */
  sf: SalesforceCredentials = { shortCode: '', organizationId: '', siteId: '', clientId: '', clientSecret: '', categoryId: '' };
  readonly sfVersion = signal( 0 );
  readonly sfComplete = computed( () => {
    this.sfVersion();
    return !!( this.sf.shortCode && this.sf.organizationId && this.sf.siteId && this.sf.clientId && this.sf.clientSecret );
  } );
  readonly uploadSummary = computed( () => {
    const done = this.uploads().filter( ( u ) => u.status === 'done' );
    const photos = done.filter( ( u ) => u.kind === 'photo' ).length;
    const pdfs = done.length - photos;
    return [photos && `${ photos } photo${ photos === 1 ? '' : 's' }`, pdfs && `${ pdfs } catalog${ pdfs === 1 ? '' : 's' }`].filter( Boolean ).join( ' and ' );
  } );
  readonly checking = signal( false );
  readonly busy = signal( false );
  readonly error = signal( '' );

  readonly canContinue = computed( () => {
    if ( this.source() === 'shopify' ) return this.shopifyUrl().trim().length > 3;
    if ( this.source() === 'csv' ) return !!this.csvText() && this.storeName().trim().length > 0;
    if ( this.source() === 'salesforce' ) return !!this.found() && this.sfComplete() && this.storeName().trim().length > 0;
    if ( this.source() === 'files' ) {
      const list = this.uploads();
      return list.some( ( u ) => u.status === 'done' ) && !list.some( ( u ) => u.status === 'uploading' ) && this.storeName().trim().length > 0;
    }
    return false;
  } );

  async ngOnInit (): Promise<void> {
    const store = await this.merchant.current().catch( () => null );
    if ( store?.name ) this.storeName.set( store.name );
    if ( store?.claimedListing ) {
      this.claimed.set( store.claimedListing );
      // Most independent shops run on Shopify: try reading the catalog from their site.
      this.shopifyUrl.set( store.claimedListing.domain );
      void this.previewShopify();
    }
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

  setSf ( key: keyof SalesforceCredentials, value: string ): void {
    this.sf = { ...this.sf, [key]: value };
    this.sfVersion.update( ( n ) => n + 1 );
    this.found.set( null );
  }

  async previewSalesforce (): Promise<void> {
    await this.runPreview( { source: 'salesforce', salesforce: this.sfRequest() } );
  }

  private sfRequest (): SalesforceCredentials {
    return { ...this.sf, categoryId: this.sf.categoryId.trim() || 'root' };
  }

  /** Photos are shrunk in the browser (long edge 1600px, JPEG) before upload. */
  async onFiles ( event: Event ): Promise<void> {
    const input = event.target as HTMLInputElement;
    const picked = Array.from( input.files || [] );
    input.value = '';
    this.error.set( '' );
    const have = this.uploads();
    let photos = have.filter( ( u ) => u.kind === 'photo' ).length;
    let pdfs = have.length - photos;
    const queue: { item: UploadItem; file: File }[] = [];
    for ( const file of picked ) {
      const kind: 'photo' | 'pdf' = file.type === 'application/pdf' || /\.pdf$/i.test( file.name ) ? 'pdf' : 'photo';
      if ( kind === 'photo' ? photos >= MAX_PHOTOS : pdfs >= MAX_PDFS ) {
        this.error.set( `Up to ${ MAX_PHOTOS } photos and ${ MAX_PDFS } PDFs. For more, use a CSV or Shopify.` );
        continue;
      }
      if ( kind === 'photo' ) photos++; else pdfs++;
      queue.push( { file, item: { key: `${ Date.now() }-${ Math.random().toString( 36 ).slice( 2 ) }`, name: file.name, kind, status: 'uploading' } } );
    }
    this.uploads.update( ( list ) => [...list, ...queue.map( ( q ) => q.item )] );
    // Three at a time.
    const work = [...queue];
    await Promise.all( Array.from( { length: 3 }, async () => {
      for ( let next = work.shift(); next; next = work.shift() ) await this.uploadOne( next.item.key, next.file, next.item.kind );
    } ) );
  }

  removeUpload ( key: string ): void {
    this.uploads.update( ( list ) => list.filter( ( u ) => u.key !== key ) );
  }

  private async uploadOne ( key: string, file: File, kind: 'photo' | 'pdf' ): Promise<void> {
    const patch = ( change: Partial<UploadItem> ) => this.uploads.update( ( list ) => list.map( ( u ) => u.key === key ? { ...u, ...change } : u ) );
    try {
      let dataUrl: string;
      if ( kind === 'pdf' ) {
        if ( file.size > MAX_PDF_BYTES ) throw new Error( 'Over 10 MB' );
        dataUrl = await readAsDataUrl( file );
      } else {
        dataUrl = await shrinkPhoto( file );
        patch( { preview: dataUrl } );
      }
      const saved = await this.merchant.upload( dataUrl, file.name );
      patch( { status: 'done', id: saved.id } );
    } catch ( error ) {
      const message = error instanceof Error && !( 'status' in error ) ? error.message : apiErrorMessage( error, 'Upload failed' );
      patch( { status: 'failed', error: message } );
    }
  }

  async next (): Promise<void> {
    const request: ImportRequest = this.source() === 'shopify'
      ? { source: 'shopify', shopifyUrl: this.shopifyUrl(), storeName: this.found()?.name }
      : this.source() === 'salesforce'
        ? { source: 'salesforce', salesforce: this.sfRequest(), storeName: this.storeName() }
      : this.source() === 'files'
        ? { source: 'files', storeName: this.storeName(), uploadIds: this.uploads().filter( ( u ) => u.status === 'done' && u.id ).map( ( u ) => u.id! ) }
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

function readAsDataUrl ( file: Blob ): Promise<string> {
  return new Promise( ( resolve, reject ) => {
    const reader = new FileReader();
    reader.onload = () => resolve( String( reader.result || '' ) );
    reader.onerror = () => reject( new Error( "Couldn't read the file" ) );
    reader.readAsDataURL( file );
  } );
}

/** Long edge at most 1600px, as JPEG. HEIC only decodes where the browser can (Safari). */
async function shrinkPhoto ( file: File ): Promise<string> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap( file );
  } catch {
    throw new Error( "Can't read this photo. Save it as JPG." );
  }
  const scale = Math.min( 1, PHOTO_EDGE / Math.max( bitmap.width, bitmap.height ) );
  const canvas = document.createElement( 'canvas' );
  canvas.width = Math.round( bitmap.width * scale );
  canvas.height = Math.round( bitmap.height * scale );
  const ctx = canvas.getContext( '2d' )!;
  ctx.fillStyle = '#fff';
  ctx.fillRect( 0, 0, canvas.width, canvas.height );
  ctx.drawImage( bitmap, 0, 0, canvas.width, canvas.height );
  bitmap.close();
  return canvas.toDataURL( 'image/jpeg', 0.85 );
}
