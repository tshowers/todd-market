import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SeoService } from '../../services/seo.service';
import { PublicHeaderComponent } from '../../shared/public-header/public-header.component';

@Component( {
  selector: 'tm-not-found',
  standalone: true,
  imports: [RouterLink, PublicHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'tt-page' },
  template: `
    <tm-public-header />
    <main class="wrap">
      <span class="tm-tag tm-tint-yellow">Not found</span>
      <h1>That page isn't here.</h1>
      <p>The link may be old, or the store may have moved.</p>
      <a class="tm-btn tm-btn--primary tm-btn--lg" routerLink="/">Back to 16Ahead Store</a>
    </main>`,
  styles: [`
    .wrap { display: flex; flex-direction: column; align-items: flex-start; gap: 16px; max-width: 640px; padding: 64px 40px; flex: 1 0 auto; }
    h1 { font-size: 46px; font-weight: 700; letter-spacing: -0.03em; line-height: 1.02; }
    p { font-size: 17px; color: var(--muted); }
    @media (max-width: 600px) { .wrap { padding: 40px 18px; } h1 { font-size: 32px; } }
  `],
} )
export class NotFoundComponent {
  constructor () {
    inject( SeoService ).set( { title: 'Not found | 16Ahead Store', description: "That page isn't here.", path: '/not-found', noindex: true } );
  }
}
