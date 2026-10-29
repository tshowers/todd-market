import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * The TODD Market mark: the four linked storefronts in the Find family
 * colors (public/assets/market-logo.png, 128px - enough for every size used).
 */
@Component( {
  selector: 'tm-ring-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<img class="brand-mark--light" src="assets/brand/products/svg/light/16-store.svg" alt="" [attr.width]="size()" [attr.height]="size()" /><img class="brand-mark--dark" src="assets/brand/products/svg/dark/16-store.svg" alt="" [attr.width]="size()" [attr.height]="size()" />`,
  styles: [':host { display: inline-grid; place-items: center; line-height: 0; } img { object-fit: contain; }'],
} )
export class RingIconComponent {
  readonly size = input( 24 );
}
