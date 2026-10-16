import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { IOS_APP_STORE_URL } from '../../models/market.constants';
import { SeoService } from '../../services/seo.service';
import { IconComponent } from '../../shared/icon/icon.component';
import { PublicFooterComponent } from '../../shared/public-footer/public-footer.component';
import { PublicHeaderComponent } from '../../shared/public-header/public-header.component';

/** TODD Market for iPhone (handoff Part 2: f05, m15). Prerendered. */
@Component( {
  selector: 'tm-ios',
  standalone: true,
  imports: [IconComponent, PublicHeaderComponent, PublicFooterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'tt-page' },
  template: `
    <tm-public-header active="ios" />
    <main class="page">
      <section class="hero">
        <div class="hero__copy">
          <span class="tm-tag tm-tint-blue">TODD Market for iPhone</span>
          <h1>Run your store from your pocket.</h1>
          <p class="lead">Get new orders and referrals as they happen, approve changes the AI suggests, and check your payouts. Shoppers can use it to shop every store in the network with one account.</p>
          <div class="get">
            @if (appStoreUrl) {
              <a class="badge" [href]="appStoreUrl" target="_blank" rel="noopener">
                <tm-icon name="apple" [size]="26" /><span><small>Download on the</small><strong>App Store</strong></span>
              </a>
            } @else {
              <span class="badge badge--soon" aria-label="Coming soon to the App Store">
                <tm-icon name="apple" [size]="26" /><span><small>Coming soon to the</small><strong>App Store</strong></span>
              </span>
            }
          </div>
          <span class="req">Requires iOS 17 or later. Free for TODD Market stores and shoppers.</span>
        </div>
        <div class="phone-wrap" aria-hidden="true">
          <div class="phone">
            <div class="screen">
              <div class="store"><span class="mark">B</span><span>Betty's Bridal</span></div>
              <div class="today">Today</div>
              <div class="kpis">
                <div class="kpi tm-tint-blue"><div>Orders</div><strong>6</strong></div>
                <div class="kpi tm-tint-green"><div>Referral earnings</div><strong>$43.10</strong></div>
              </div>
              @for (n of feed; track n.t) {
                <div class="note"><span class="dot" [class.dot--blue]="n.kind === 'blue'" [class.dot--cyan]="n.kind === 'cyan'"></span>
                  <span><strong>{{ n.t }}</strong><small>{{ n.s }}</small></span></div>
              }
            </div>
          </div>
        </div>
      </section>
      <section class="features">
        @for (f of features; track f.t) {
          <div class="feature" [class]="'tm-tint-' + f.tint"><h2>{{ f.t }}</h2><p>{{ f.b }}</p></div>
        }
      </section>
    </main>
    <tm-public-footer />`,
  styles: [`
    .page { max-width: 1160px; width: 100%; margin: 0 auto; display: flex; flex-direction: column; gap: 32px; padding: 36px 40px 48px; flex: 1 0 auto; }
    .hero { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr)); gap: 40px; align-items: center; }
    .hero__copy { display: flex; flex-direction: column; gap: 18px; }
    h1 { font-size: 52px; font-weight: 700; letter-spacing: -0.035em; line-height: 1.02; text-wrap: balance; }
    .lead { font-size: 18px; line-height: 1.6; color: var(--muted); text-wrap: pretty; }
    .get { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
    .badge { display: inline-flex; align-items: center; gap: 10px; height: 56px; padding: 0 22px; border-radius: 14px; background: var(--text); color: var(--bg); }
    .badge:hover { color: var(--bg); }
    .badge span { display: flex; flex-direction: column; line-height: 1.1; }
    .badge small { font-size: 11px; }
    .badge strong { font-size: 19px; }
    .badge--soon { opacity: .55; }
    .req { font-size: 13px; color: var(--muted); }
    .phone-wrap { display: flex; justify-content: center; }
    .phone { width: 300px; height: 610px; border-radius: 48px; background: var(--text); padding: 10px; box-shadow: var(--shadow); }
    .screen { width: 100%; height: 100%; border-radius: 40px; background: var(--bg); overflow: hidden; display: flex; flex-direction: column; gap: 12px; padding: 46px 16px 16px; }
    .store { display: flex; align-items: center; gap: 10px; font-size: 16px; font-weight: 700; }
    .mark { width: 30px; height: 30px; border-radius: 9px; background: var(--t-pink); color: var(--t-pink-fg); display: grid; place-items: center; font-size: 15px; font-weight: 700; }
    .today { font-size: 24px; font-weight: 700; letter-spacing: -0.02em; }
    .kpis { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
    .kpi { padding: 12px; border-radius: 16px; color: var(--text); }
    .kpi div { font-size: 11px; font-weight: 600; }
    .kpi strong { font-size: 22px; }
    .note { display: flex; gap: 10px; padding: 12px; border-radius: 16px; background: var(--surface); }
    .note > span:last-child { display: flex; flex-direction: column; gap: 2px; }
    .note strong { font-size: 13px; }
    .note small { font-size: 12px; color: var(--muted); }
    .dot { width: 10px; height: 10px; border-radius: 50%; background: var(--muted); margin-top: 4px; flex: none; }
    .dot--blue { background: var(--blue); box-shadow: 0 0 0 4px var(--t-blue); }
    .dot--cyan { background: var(--cyan); }
    .features { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(220px, 100%), 1fr)); gap: 14px; }
    .feature { display: flex; flex-direction: column; gap: 8px; padding: 24px; border-radius: 28px; }
    .feature h2 { font-size: 20px; font-weight: 700; letter-spacing: -0.02em; }
    .feature p { font-size: 15px; line-height: 1.6; color: var(--text); text-wrap: pretty; }
    @media (max-width: 600px) { .page { padding: 18px 18px 32px; } h1 { font-size: 34px; } }
  `],
} )
export class IosComponent {
  readonly appStoreUrl = IOS_APP_STORE_URL;
  readonly feed = [
    { t: 'New order · $328.35', s: 'Maya O. · 4 items, 2 stores', kind: 'blue' },
    { t: 'Referral earned · $18.50', s: "Cameron's sold a Halden oxford", kind: 'cyan' },
    { t: 'Approve 3 new descriptions', s: 'Fall guest dresses', kind: '' },
    { t: 'Payout on the way · $1,204.60', s: 'Arrives Friday', kind: '' },
  ];
  readonly features = [
    { t: 'Orders as they happen', tint: 'blue', b: 'A notification for every order, with what to pack and when it ships.' },
    { t: 'Referral alerts', tint: 'cyan', b: 'See when you send or receive a shopper, and what you earned.' },
    { t: 'Approve AI changes', tint: 'green', b: 'New descriptions, collections and prices wait for your OK.' },
    { t: 'Payouts', tint: 'violet', b: "Check your Stripe balance, payout dates and what's left to verify." },
  ];

  constructor () {
    inject( SeoService ).set( {
      title: 'TODD Market for iPhone: Run your store from your pocket',
      description: 'Get new orders and referrals as they happen, approve changes the AI suggests, and check your payouts.',
      path: '/ios',
    } );
  }
}
