import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { BuildJob } from '../../../models/merchant.model';
import { apiErrorMessage } from '../../../services/market-api.service';
import { MerchantService } from '../../../services/merchant.service';

const POLL_MS = 1200;

/** 1.3 Build (d03): the five tasks, driven by the real job's progress; moves on to Review when done. */
@Component( {
  selector: 'tm-build',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="wrap">
      <div><h1 class="tm-h1">Building {{ storeName() }}.</h1><p class="tm-lead">{{ subline() }}</p></div>
      @if (job(); as j) {
        <ol class="trace">
          @for (s of j.steps; track $index; let last = $last) {
            <li [class]="s.state">
              <div class="rail"><span class="node"></span>@if (!last) { <span class="line"></span> }</div>
              <div class="text"><strong>{{ s.label }}</strong>@if (s.detail) { <span>{{ s.detail }}</span> }</div>
            </li>
          }
        </ol>
      }
      @if (error()) {
        <span class="tm-error" role="alert">{{ error() }}</span>
        <div><button type="button" class="tm-btn tm-btn--primary" (click)="retry()">Try again</button></div>
      }
    </section>`,
  styles: [`
    .wrap { display: flex; flex-direction: column; gap: 26px; max-width: 640px; }
    .trace { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; }
    li { display: grid; grid-template-columns: 28px 1fr; column-gap: 16px; }
    .rail { display: flex; flex-direction: column; align-items: center; }
    .node { width: 14px; height: 14px; margin-top: 4px; border-radius: 50%; background: transparent; border: 2.5px solid var(--surface2); flex: none; }
    .line { width: 2.5px; flex: 1; min-height: 26px; background: var(--surface2); border-radius: 2px; }
    .done .node { background: var(--cyan); border-color: var(--cyan); }
    .done .line { background: var(--cyan); }
    .active .node { width: 16px; height: 16px; margin-top: 3px; background: var(--blue); border-color: var(--blue); animation: tmPulse 1.4s ease-in-out infinite; }
    .failed .node { background: var(--t-pink-fg); border-color: var(--t-pink-fg); }
    .text { padding: 0 0 22px; display: flex; flex-direction: column; gap: 2px; }
    .text strong { font-size: 16px; font-weight: 600; color: var(--muted); }
    .done .text strong, .active .text strong { color: var(--text); }
    .text span { font-size: 13px; color: var(--muted); }
    @media (prefers-reduced-motion: reduce) { .active .node { animation: none; } }
  `],
} )
export class BuildComponent implements OnInit {
  private readonly merchant = inject( MerchantService );
  private readonly route = inject( ActivatedRoute );
  private readonly router = inject( Router );
  private readonly destroyRef = inject( DestroyRef );

  readonly storeName = signal( 'your store' );
  readonly subline = signal( '' );
  readonly job = signal<BuildJob | null>( null );
  readonly error = signal( '' );
  private timer: ReturnType<typeof setTimeout> | null = null;
  private jobId = '';

  async ngOnInit (): Promise<void> {
    this.destroyRef.onDestroy( () => this.timer && clearTimeout( this.timer ) );
    const store = await this.merchant.current().catch( () => null );
    if ( store ) {
      this.storeName.set( store.name );
      this.subline.set( `Imported from ${ ( { shopify: 'Shopify', csv: 'a CSV file' } as Record<string, string> )[store.source] || 'your catalog' }` );
    }
    this.jobId = this.route.snapshot.queryParamMap.get( 'job' ) || ( await this.merchant.latestBuild().catch( () => null ) )?.id || '';
    if ( !this.jobId ) {
      await this.router.navigateByUrl( '/app/onboarding/brand' );
      return;
    }
    await this.poll();
  }

  async retry (): Promise<void> {
    this.error.set( '' );
    try {
      const { jobId } = await this.merchant.startBuild();
      this.jobId = jobId;
      await this.router.navigate( [], { queryParams: { job: jobId }, replaceUrl: true } );
      await this.poll();
    } catch ( error ) {
      this.error.set( apiErrorMessage( error ) );
    }
  }

  private async poll (): Promise<void> {
    try {
      const job = await this.merchant.build( this.jobId );
      this.job.set( job );
      if ( job.status === 'done' ) {
        await this.merchant.load();
        this.timer = setTimeout( () => void this.router.navigateByUrl( '/app/onboarding/review' ), 900 );
        return;
      }
      if ( job.status === 'failed' ) {
        this.error.set( job.error || 'The build stopped. Try again; your catalog is saved.' );
        return;
      }
    } catch ( error ) {
      this.error.set( apiErrorMessage( error, 'We lost track of the build. Try again.' ) );
      return;
    }
    this.timer = setTimeout( () => void this.poll(), POLL_MS );
  }
}
