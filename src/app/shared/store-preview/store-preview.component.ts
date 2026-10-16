import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { TunedBrand } from '../../models/merchant.model';
import { brandStyle } from '../brand/brand-tuning';

/**
 * The mini storefront on Review and Get paid (§1.4): store mark, name and
 * address, the hero line, a search pill with Find in the brand accent, and
 * collection tags in the brand tint. The caption goes under it.
 */
@Component( {
  selector: 'tm-store-preview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="frame tm-branded" [style]="style()">
      <div class="store">
        <div class="head">
          <span class="tm-store-mark mark">
            @if (logoUrl()) { <img [src]="logoUrl()" alt=""> } @else { {{ initial() }} }
          </span>
          <span class="name">{{ name() }}</span>
          <span class="addr">{{ address() }}</span>
        </div>
        <div class="hero">{{ heroLine() }}</div>
        <div class="search"><span>Describe what you need…</span><span class="find">Find</span></div>
        <div class="tags">
          @for (c of collections(); track c) { <span class="tm-brand-tag">{{ c }}</span> }
        </div>
      </div>
      <div class="caption"><ng-content /></div>
    </div>`,
  styles: [`
    .frame { border-radius: 20px; background: var(--surface); padding: 14px; }
    .store { border-radius: 16px; background: var(--bg); padding: 22px; display: flex; flex-direction: column; gap: 14px; box-shadow: var(--shadow-sm); }
    .head { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .mark { width: 34px; height: 34px; border-radius: 10px; font-size: 17px; }
    .name { font-weight: 700; letter-spacing: -0.02em; font-size: 18px; }
    .addr { margin-left: auto; font-size: 12px; color: var(--muted); overflow-wrap: anywhere; }
    .hero { font-weight: 700; letter-spacing: -0.02em; font-size: 26px; line-height: 1.1; max-width: 380px; }
    .search { display: flex; align-items: center; gap: 8px; padding: 5px 5px 5px 16px; border-radius: 999px; background: var(--surface); font-size: 14px; color: var(--muted); }
    .search span:first-child { flex: 1; }
    .find { padding: 8px 16px; border-radius: 999px; background: var(--accent); color: #fff; font-weight: 700; font-size: 13px; }
    .tags { display: flex; flex-wrap: wrap; gap: 6px; }
    .caption { display: flex; align-items: center; gap: 8px; padding: 12px 8px 2px; font-size: 12px; color: var(--muted); }
    .caption:empty { display: none; }
  `],
} )
export class StorePreviewComponent {
  readonly name = input.required<string>();
  readonly address = input( '' );
  readonly logoUrl = input<string | null>( null );
  readonly tuned = input<TunedBrand | null>( null );
  readonly heroLine = input( '' );
  readonly collections = input<string[]>( [] );

  readonly initial = computed( () => this.name().charAt( 0 ).toUpperCase() );
  readonly style = computed( () => brandStyle( this.tuned() ) );
}
