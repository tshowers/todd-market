import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

/** The short footer under About and Help: a way back, and the company line. */
@Component( {
  selector: 'tm-public-footer',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <footer class="foot">
      <a routerLink="/">← Back to 16Ahead Store</a>
      @if (aboutLink()) {
        <a routerLink="/about">About 16Ahead Store →</a>
      } @else {
        <span class="muted">16Ahead Store · Taliferro Tech, LLC</span>
      }
    </footer>`,
  styles: [`
    .foot { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px;
      padding: 24px 40px 28px; font-size: 13px; border-top: 1px solid var(--surface2); }
    a { font-weight: 600; color: var(--text); }
    a:hover { color: var(--blue-ink); }
    .muted { color: var(--muted); }
    @media (max-width: 600px) { .foot { padding: 20px 18px 28px; } }
  `],
} )
export class PublicFooterComponent {
  readonly aboutLink = input( false );
}
