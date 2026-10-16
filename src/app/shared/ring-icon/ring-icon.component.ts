import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * The TODD Market mark (README §5, option 1 "Shopping bag"): the TODD circuit
 * ring with a bag inside and the blue node where an item goes in. The ring is
 * an approximation of the master TODD art; swap the paths when it arrives.
 */
@Component( {
  selector: 'tm-ring-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 100 100" fill="none" stroke="currentColor"
         stroke-width="6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M67.75 11.94A42 42 0 1 1 32.25 11.94" />
      <circle cx="67.75" cy="11.94" r="3" fill="currentColor" />
      <circle cx="32.25" cy="11.94" r="3" fill="currentColor" />
      <path d="M35 44h30l-3 28H38z" />
      <path d="M43 44v-4a7 7 0 0 1 14 0v4" />
      @if (halo()) { <circle cx="50" cy="58" r="11" fill="var(--t-blue)" stroke="none" /> }
      <circle cx="50" cy="58" r="5.5" fill="var(--blue)" stroke="none" />
    </svg>`,
  styles: [':host { display: inline-grid; place-items: center; line-height: 0; }'],
} )
export class RingIconComponent {
  readonly size = input( 24 );
  /** The 11r halo, for large sizes only. */
  readonly halo = input( false );
}
