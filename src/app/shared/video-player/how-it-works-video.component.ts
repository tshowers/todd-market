import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, ElementRef, PLATFORM_ID, afterNextRender, inject, signal, viewChild,
} from '@angular/core';
import { currentTheme, type ThemeMode } from '@taliferro/ui/platform/theme';

import { IconComponent } from '../icon/icon.component';

const VIDEO = ( mode: ThemeMode ) => `/assets/video/todd-market-how-it-works-${ mode }`;

/**
 * The landing page's "How it works" video (handoff Part 2, Landing). There
 * are two cuts, light and dark; the player shows the one that matches the
 * page and swaps when the theme changes, keeping its place. Click to play
 * (muted: captions are burned in, there's no audio).
 */
@Component( {
  selector: 'tm-how-it-works-video',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="frame">
      <video #video [attr.src]="src() + '.mp4'" [attr.poster]="src() + '.jpg'" playsinline muted preload="metadata"
        [attr.controls]="started() ? '' : null" (ended)="started.set(false)"
        aria-label="How TODD Market works: a store goes from catalog to first referral. 90 seconds, captions on screen, no sound."></video>
      @if (!started()) {
        <button type="button" class="cover" (click)="play()">
          <span class="play"><tm-icon name="play" [size]="34" /></span>
          <span class="label">Watch how it works</span>
        </button>
      }
    </div>`,
  styles: [`
    .frame { position: relative; width: 100%; aspect-ratio: 16 / 9; border-radius: 28px; overflow: hidden; background: var(--surface); }
    video { display: block; width: 100%; height: 100%; object-fit: cover; }
    .cover { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center;
      gap: 18px; border: 0; padding: 0; min-height: 0; cursor: pointer; font: inherit; color: var(--text);
      background: color-mix(in srgb, var(--surface) 84%, transparent); }
    .play { width: 96px; height: 96px; border-radius: 50%; background: var(--blue); color: #fff; display: grid; place-items: center;
      box-shadow: 0 0 0 12px var(--t-blue), 0 0 40px var(--blue); }
    .label { font-size: 17px; font-weight: 700; }
    @media (max-width: 600px) { .play { width: 64px; height: 64px; } }
  `],
} )
export class HowItWorksVideoComponent {
  private readonly video = viewChild.required<ElementRef<HTMLVideoElement>>( 'video' );
  private readonly isBrowser = isPlatformBrowser( inject( PLATFORM_ID ) );
  /** The light cut is what search engines and the prerendered page get. */
  readonly src = signal( VIDEO( 'light' ) );
  readonly started = signal( false );

  constructor () {
    const destroyRef = inject( DestroyRef );
    afterNextRender( () => {
      this.syncTheme();
      // The theme pill sets data-theme on <html>; the system setting changes via the media query.
      const observer = new MutationObserver( () => this.syncTheme() );
      observer.observe( document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class'] } );
      const media = window.matchMedia( '(prefers-color-scheme: dark)' );
      const onMedia = () => this.syncTheme();
      media.addEventListener( 'change', onMedia );
      destroyRef.onDestroy( () => { observer.disconnect(); media.removeEventListener( 'change', onMedia ); } );
    } );
  }

  play (): void {
    if ( !this.isBrowser ) return;
    this.started.set( true );
    void this.video().nativeElement.play().catch( () => this.started.set( false ) );
  }

  private syncTheme (): void {
    const next = VIDEO( currentTheme() );
    if ( next === this.src() ) return;
    const el = this.video().nativeElement;
    const at = el.currentTime;
    const wasPlaying = !el.paused;
    this.src.set( next );
    el.addEventListener( 'loadedmetadata', () => {
      el.currentTime = at;
      if ( wasPlaying ) void el.play();
    }, { once: true } );
  }
}
