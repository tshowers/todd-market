import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { MarketAuthService } from '../../services/market-auth.service';
import { PlatformMenuComponent } from '../../shared/platform-menu/platform-menu.component';

/** Account (f08, m18): one TODD account at every store in the network. */
@Component( {
  selector: 'tm-account-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, PlatformMenuComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'tt-page' },
  template: `
    <div class="page">
      <header class="head"><a routerLink="/" class="title">16Ahead <span>Store</span></a>
        <app-platform-menu [isLoggedIn]="true" [userName]="auth.user()?.displayName || ''" [userEmail]="auth.user()?.email || ''" (signOut)="signOut()" /></header>
      <div class="layout">
        <aside class="side">
          <div class="who"><span class="avatar">{{ initials() }}</span><div><strong>{{ auth.user()?.displayName || 'Your account' }}</strong><span>{{ auth.user()?.email }}</span></div></div>
          <nav aria-label="Account">
            <a routerLink="/account" [routerLinkActiveOptions]="{ exact: false }" routerLinkActive="on" [class.on]="isOrders()">Orders</a>
            <a routerLink="/account/saved" routerLinkActive="on">Saved</a>
            <a routerLink="/account/addresses" routerLinkActive="on">Addresses</a>
            <a routerLink="/account/payment-methods" routerLinkActive="on">Payment methods</a>
            <a routerLink="/account/security" routerLinkActive="on">Sign-in &amp; security</a>
          </nav>
          <p class="note">One 16Ahead account works at every store in the network.</p>
        </aside>
        <main class="main"><router-outlet /></main>
      </div>
    </div>`,
  styles: [`
    .page { width: 100%; max-width: 1160px; margin: 0 auto; padding: 30px 40px 48px; display: flex; flex-direction: column; gap: 24px; flex: 1 0 auto; }
    .head { display: flex; justify-content: space-between; align-items: center; }
    .title { font-size: 20px; font-weight: 700; letter-spacing: -0.02em; color: var(--text); }
    .title span { font-weight: 500; color: var(--muted); }
    .layout { display: grid; grid-template-columns: 260px minmax(0, 1fr); gap: 28px; align-items: start; }
    .side { display: flex; flex-direction: column; gap: 14px; }
    .who { display: flex; align-items: center; gap: 12px; }
    .who div { display: flex; flex-direction: column; min-width: 0; font-size: 14px; }
    .who span:not(.avatar) { font-size: 13px; color: var(--muted); overflow: hidden; text-overflow: ellipsis; }
    .avatar { width: 56px; height: 56px; border-radius: 50%; background: var(--t-blue); color: var(--t-blue-fg); display: grid; place-items: center; font-weight: 700; font-size: 18px; flex: none; }
    nav { display: flex; flex-direction: column; gap: 2px; }
    nav a { padding: 10px 12px; border-radius: 14px; font-size: 15px; font-weight: 600; color: var(--text); }
    nav a.on, nav a:hover { background: var(--surface); color: var(--text); }
    .note { font-size: 13px; color: var(--muted); }
    @media (max-width: 860px) {
      .page { padding: 22px 18px 32px; }
      .layout { grid-template-columns: minmax(0, 1fr); }
      nav { flex-direction: row; flex-wrap: wrap; gap: 6px; }
      nav a { padding: 8px 12px; border-radius: 999px; background: var(--surface); font-size: 14px; }
      nav a.on { background: var(--text); color: var(--bg); }
    }
  `],
} )
export class AccountShellComponent {
  readonly auth = inject( MarketAuthService );
  private readonly router = inject( Router );
  readonly initials = computed( () => {
    const user = this.auth.user();
    const source = user?.displayName || user?.email || '?';
    return source.split( /[\s@.]+/ ).filter( Boolean ).slice( 0, 2 ).map( ( w ) => w[0].toUpperCase() ).join( '' );
  } );

  isOrders (): boolean {
    const path = this.router.url.split( /[?#]/ )[0];
    return path === '/account' || path.startsWith( '/account/orders' );
  }

  async signOut (): Promise<void> {
    await this.auth.signOut();
    await this.router.navigateByUrl( '/' );
  }
}
