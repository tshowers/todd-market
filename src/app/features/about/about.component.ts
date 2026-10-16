import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SeoService } from '../../services/seo.service';
import { PublicFooterComponent } from '../../shared/public-footer/public-footer.component';
import { PublicHeaderComponent } from '../../shared/public-header/public-header.component';
import { RingIconComponent } from '../../shared/ring-icon/ring-icon.component';

/** About TODD Market (handoff Part 2: e04, m11; same structure as Find's About, 4e). Prerendered. */
@Component( {
  selector: 'tm-about',
  standalone: true,
  imports: [RouterLink, PublicHeaderComponent, PublicFooterComponent, RingIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'tt-page' },
  template: `
    <tm-public-header active="about" />
    <main class="page">
      <section class="hero">
        <div class="hero__copy">
          <div class="kicker"><span class="tm-tag tm-tint-blue">About TODD Market</span><span>A Taliferro Tech product · Part of TODD</span></div>
          <h1>Commerce for independent stores, connected to each other.</h1>
          <p class="lead">TODD Market turns a store's catalog into a working storefront, helps shoppers find what they asked for, and links independent stores into a referral network so no shopper leaves empty-handed.</p>
        </div>
        <div class="icon"><tm-ring-icon class="icon--big" [size]="96" [halo]="true" /><tm-ring-icon class="icon--small" [size]="52" /></div>
      </section>

      <section class="cards">
        @for (c of cards; track c.tag) {
          <div class="card">
            <span class="tm-tag" [class]="'tm-tint-' + c.tint">{{ c.tag }}</span>
            <h2>{{ c.title }}</h2>
            <p>{{ c.body }}</p>
          </div>
        }
      </section>

      <section class="idea">
        <div class="idea__head">
          <div class="tm-eyebrow ink">The product idea</div>
          <h2>A shopper should never hit a dead end.</h2>
        </div>
        <div class="idea__body">
          <p>Most online stores make shoppers do the work: browse categories, set filters, compare tabs. TODD Market lets them describe what they need, then narrows, bundles and explains the trade-offs.</p>
          <p>When a store doesn't carry something, the usual result is a lost shopper. In TODD Market, the store hands that shopper to a trusted store nearby, in its own voice, and earns part of the sale.</p>
        </div>
      </section>

      <div class="actions">
        <a class="tm-btn tm-btn--primary tm-btn--lg" routerLink="/app/onboarding">Start selling →</a>
        <a class="tm-btn tm-btn--lg" routerLink="/help">Read TODD Market Help →</a>
      </div>
    </main>
    <tm-public-footer />`,
  styles: [`
    .page { max-width: 1040px; width: 100%; margin: 0 auto; display: flex; flex-direction: column; gap: 20px; padding: 36px 40px 48px; flex: 1 0 auto; }
    .hero { display: grid; grid-template-columns: minmax(0, 1fr) 140px; gap: 48px; align-items: center; padding-bottom: 28px; }
    .hero__copy { display: flex; flex-direction: column; gap: 16px; }
    .kicker { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; font-size: 14px; color: var(--muted); }
    h1 { font-size: 60px; font-weight: 700; letter-spacing: -0.04em; line-height: 1; text-wrap: balance; }
    .lead { font-size: 19px; line-height: 1.6; color: var(--muted); max-width: 680px; text-wrap: pretty; }
    .icon { width: 140px; height: 140px; border-radius: 50%; background: var(--surface); display: grid; place-items: center; }
    .icon--small { display: none; }
    .cards { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
    .card { display: flex; flex-direction: column; gap: 10px; padding: 28px; border-radius: 28px; background: var(--surface); }
    .card h2 { font-size: 26px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.15; }
    .card p { font-size: 16px; line-height: 1.6; color: var(--muted); text-wrap: pretty; }
    .idea { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(300px, 100%), 1fr)); gap: 40px; padding: 36px; border-radius: 28px; background: var(--t-blue); color: var(--t-blue-fg); }
    .idea__head { display: flex; flex-direction: column; gap: 12px; }
    .idea__head h2 { font-size: 34px; font-weight: 700; letter-spacing: -0.03em; line-height: 1.1; }
    .ink { color: inherit; }
    .idea__body { display: flex; flex-direction: column; gap: 14px; font-size: 17px; line-height: 1.6; color: var(--text); }
    .idea__body p { text-wrap: pretty; }
    .actions { display: flex; gap: 10px; flex-wrap: wrap; padding-top: 8px; }
    @media (max-width: 600px) {
      .page { padding: 18px 18px 32px; }
      .hero { grid-template-columns: minmax(0, 1fr); gap: 20px; }
      .icon { width: 74px; height: 74px; order: -1; }
      .icon--big { display: none; }
      .icon--small { display: inline-grid; }
      h1 { font-size: 38px; }
      .cards { grid-template-columns: minmax(0, 1fr); }
      .idea { padding: 24px; }
    }
  `],
} )
export class AboutComponent {
  readonly cards = [
    { tag: 'What it is', tint: 'blue', title: 'A storefront and a referral network', body: 'An AI-built store for independent merchants, connected to other stores that refer shoppers to each other.' },
    { tag: "Who it's for", tint: 'violet', title: 'Independent stores', body: 'Boutiques, specialty shops and local makers who want an online store without a long setup.' },
    { tag: 'Who made it', tint: 'pink', title: 'Taliferro Tech', body: 'TODD Market is part of TODD, the Taliferro Tech family that also includes Find.' },
    { tag: 'Where it lives', tint: 'cyan', title: 'On the web and inside Find', body: 'Each store gets its own address, and every listing can be read by AI shopping agents.' },
  ];

  constructor () {
    inject( SeoService ).set( {
      title: 'About TODD Market | Taliferro Tech',
      description: "TODD Market turns a store's catalog into a working storefront, helps shoppers find what they asked for, and links independent stores into a referral network.",
      path: '/about',
    } );
  }
}
