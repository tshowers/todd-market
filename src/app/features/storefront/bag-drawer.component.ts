import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { BagService } from '../../services/bag.service';
import { IconComponent } from '../../shared/icon/icon.component';
import { MoneyPipe } from '../../shared/money.pipe';

/** The bag (d14): a right-side drawer, items grouped by store, one checkout. */
@Component( {
  selector: 'tm-bag-drawer',
  standalone: true,
  imports: [RouterLink, IconComponent, MoneyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (bag.open()) {
      <div class="scrim" (click)="bag.open.set(false)"></div>
      <aside class="drawer" role="dialog" aria-modal="true" aria-label="Your bag">
        <div class="head"><h2>Your bag</h2><button type="button" class="close" aria-label="Close bag" (click)="bag.open.set(false)"><tm-icon name="x" [size]="20" /></button></div>
        @for (g of bag.groups(); track g.storeId) {
          <div class="group">
            <div class="tm-label store"><span class="dot" [class.dot--network]="g.storeId !== homeStoreId()"></span>{{ g.storeName }}</div>
            @for (i of g.items; track i.key) {
              <div class="row">
                @if (i.image) { <img [src]="i.image" alt=""> } @else { <span class="ph"></span> }
                <div class="info"><strong>{{ i.title }}</strong>@if (i.variantTitle) { <span>{{ i.variantTitle }}</span> }</div>
                <div class="qty">
                  <button type="button" aria-label="One fewer" (click)="bag.setQuantity(i.key, i.quantity - 1)"><tm-icon name="minus" [size]="14" /></button>
                  <span>{{ i.quantity }}</span>
                  <button type="button" aria-label="One more" (click)="bag.setQuantity(i.key, i.quantity + 1)"><tm-icon name="plus" [size]="14" /></button>
                </div>
                <span class="price">{{ i.priceCents * i.quantity | money }}</span>
              </div>
            }
          </div>
        } @empty {
          <p class="empty">Your bag is empty.</p>
        }
        @if (bag.count()) {
          <div class="total"><span>Total</span><strong>{{ bag.totalCents() | money: true }}</strong></div>
          <a class="tm-btn tm-btn--primary tm-btn--block" [routerLink]="['/s', storeSlug(), 'checkout']" (click)="bag.open.set(false)">Check out</a>
          <p class="note">{{ bag.groups().length > 1 ? 'One checkout. Each store charges and ships its own items.' : 'Ships from ' + bag.groups()[0].storeName + '.' }}</p>
        }
      </aside>
    }`,
  styles: [`
    .scrim { position: fixed; inset: 0; background: rgba(0, 0, 0, .35); z-index: 50; }
    .drawer { position: fixed; top: 0; right: 0; bottom: 0; width: min(380px, 100%); background: var(--bg); z-index: 51; padding: 22px; display: flex; flex-direction: column; gap: 16px; overflow-y: auto; box-shadow: var(--shadow); animation: tmUp .25s ease-out; }
    .head { display: flex; align-items: center; justify-content: space-between; }
    h2 { font-size: 24px; font-weight: 700; letter-spacing: -0.02em; }
    .close { width: 40px; height: 40px; min-height: 0; padding: 0; border: 0; border-radius: 50%; background: var(--surface); color: var(--text); display: grid; place-items: center; cursor: pointer; }
    .group { display: flex; flex-direction: column; gap: 8px; }
    .store { display: flex; align-items: center; gap: 8px; }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--blue); }
    .dot--network { background: var(--cyan); }
    .row { display: grid; grid-template-columns: 48px 1fr auto; grid-template-areas: "img info price" "img qty qty"; gap: 4px 12px; align-items: center; padding: 12px; border-radius: 16px; background: var(--surface); }
    .row img, .ph { grid-area: img; width: 48px; height: 48px; border-radius: 12px; object-fit: cover; background: var(--surface2); }
    .info { grid-area: info; display: flex; flex-direction: column; font-size: 14px; min-width: 0; }
    .info span { font-size: 12px; color: var(--muted); }
    .price { grid-area: price; font-size: 14px; font-weight: 700; }
    .qty { grid-area: qty; display: flex; align-items: center; gap: 8px; font-size: 13px; }
    .qty button { width: 28px; height: 28px; min-height: 0; padding: 0; border: 0; border-radius: 50%; background: var(--bg); color: var(--text); display: grid; place-items: center; cursor: pointer; }
    .total { display: flex; justify-content: space-between; font-size: 17px; padding-top: 8px; border-top: 1px solid var(--surface2); }
    .note, .empty { font-size: 13px; color: var(--muted); }
  `],
} )
export class BagDrawerComponent {
  readonly bag = inject( BagService );
  readonly homeStoreId = input( '' );
  readonly storeSlug = input.required<string>();
}
