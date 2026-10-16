import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

import { MarketAuthService } from '../../services/market-auth.service';
import { PlatformMenuComponent } from '../platform-menu/platform-menu.component';
import { RingIconComponent } from '../ring-icon/ring-icon.component';

export type PublicNavKey = 'how' | 'shop' | 'pricing' | 'ios' | 'help' | 'about' | '';

/**
 * The top bar on TODD Market's own pages (Landing, About, Help, Pricing,
 * iPhone, Sign in): ring + "TODD Market", the page pills, Sign in, Start
 * selling, and the universal menu inline at the end (PRODUCT-STANDARD: one
 * Menu button per screen).
 */
@Component( {
  selector: 'tm-public-header',
  standalone: true,
  imports: [RouterLink, RingIconComponent, PlatformMenuComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="bar">
      <a class="brand" routerLink="/sell" aria-label="TODD Market for stores">
        <span class="mark"><tm-ring-icon [size]="24" /></span>
        <span class="word">TODD <span>Market</span></span>
      </a>
      <nav class="pills" aria-label="TODD Market">
        <a routerLink="/sell" fragment="how-it-works" [class.on]="active() === 'how'">How it works</a>
        <a routerLink="/" [class.on]="active() === 'shop'">Shop stores</a>
        <a routerLink="/pricing" [class.on]="active() === 'pricing'">Pricing</a>
        <a routerLink="/ios" [class.on]="active() === 'ios'">iPhone</a>
        <a routerLink="/help" [class.on]="active() === 'help'">Help</a>
        <a routerLink="/about" [class.on]="active() === 'about'">About</a>
      </nav>
      @if (auth.isSignedIn()) {
        <a class="tm-btn signin" routerLink="/app">My store</a>
      } @else {
        <a class="tm-btn signin" routerLink="/sign-in" [queryParams]="{ as: 'merchant' }">Sign in</a>
      }
      <a class="tm-btn tm-btn--primary start" routerLink="/app/onboarding">Start selling</a>
      <app-platform-menu [isLoggedIn]="auth.isSignedIn()" [userName]="auth.user()?.displayName || ''"
        [userEmail]="auth.user()?.email || ''" (signOut)="signOut()" />
    </header>`,
  styles: [`
    .bar { display: flex; align-items: center; gap: 14px; flex-wrap: wrap; padding: 20px 40px; }
    .brand { display: flex; align-items: center; gap: 10px; margin-right: auto; color: var(--text); }
    .brand:hover { color: var(--text); }
    .mark { width: 34px; height: 34px; border-radius: 50%; background: var(--surface); display: grid; place-items: center; }
    .word { font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }
    .word span { font-weight: 500; color: var(--muted); }
    .pills { display: flex; gap: 4px; }
    .pills a { padding: 8px 14px; border-radius: 999px; font-size: 14px; font-weight: 600; color: var(--text); white-space: nowrap; }
    .pills a:hover, .pills a.on { background: var(--surface); color: var(--text); }
    .signin { height: 42px; font-size: 14px; }
    .start { height: 42px; }
    @media (max-width: 980px) { .pills { display: none; } }
    @media (max-width: 600px) {
      .bar { padding: 20px 18px 10px; gap: 10px; flex-wrap: nowrap; }
      .signin { display: none; }
    }
    /* One Menu button per screen, always: below 420px the hero's Start selling is enough. */
    @media (max-width: 420px) { .start { display: none; } }
  `],
} )
export class PublicHeaderComponent {
  readonly active = input<PublicNavKey>( '' );
  readonly auth = inject( MarketAuthService );
  private readonly router = inject( Router );

  async signOut (): Promise<void> {
    await this.auth.signOut();
    await this.router.navigateByUrl( '/' );
  }
}
