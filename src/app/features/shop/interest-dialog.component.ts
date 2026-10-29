import { ChangeDetectionStrategy, Component, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { BagService } from '../../services/bag.service';
import { apiErrorMessage } from '../../services/market-api.service';
import { ShopService } from '../../services/shop.service';

/**
 * "Want to buy it here?" on a shop that isn't on TODD Market yet (seeding
 * plan, phase 2). Records the interest; the email is optional and only
 * used to say when the shop joins.
 */
@Component( {
  selector: 'tm-interest-dialog',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="scrim" (click)="closed.emit()"></div>
    <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="interest-title">
      @if (!done()) {
        <h2 id="interest-title">Want to buy from {{ shopName() }} here?</h2>
        <p>{{ shopName() }} isn't on 16Ahead Store yet. We'll let them know shoppers want to buy {{ productTitle() ? '"' + productTitle() + '"' : 'from them' }} here, with one checkout and one bag.</p>
        <label class="check"><input type="checkbox" [ngModel]="notify()" (ngModelChange)="notify.set($event)"> Email me when {{ shopName() }} joins</label>
        @if (notify()) { <input class="tm-input" type="email" placeholder="you@example.com" [ngModel]="email()" (ngModelChange)="email.set($event)" autocomplete="email"> }
        @if (error()) { <p class="tm-error">{{ error() }}</p> }
        <div class="actions">
          <button type="button" class="tm-btn tm-btn--primary" [disabled]="busy() || (notify() && !email())" (click)="send()">{{ busy() ? 'Sending…' : 'Tell them' }}</button>
          <a class="tm-btn" [href]="productUrl() || shopUrl()" target="_blank" rel="noopener nofollow">Shop on their site ↗</a>
        </div>
        <p class="fine">We only use your email to tell you when this shop joins, once.</p>
      } @else {
        <h2 id="interest-title">Thanks, we'll let them know.</h2>
        <p>{{ notify() ? "We'll email you once if " + shopName() + ' joins 16Ahead Market.' : 'You can still shop on their website in the meantime.' }}</p>
        <div class="actions"><button type="button" class="tm-btn" (click)="closed.emit()">Done</button></div>
      }
    </div>`,
  styles: [`
    .scrim { position: fixed; inset: 0; background: rgba(0, 0, 0, .4); z-index: 60; }
    .dialog { position: fixed; left: 50%; top: 50%; transform: translate(-50%, -50%); z-index: 61; width: min(460px, calc(100% - 32px)); padding: 26px; border-radius: 20px; background: var(--bg); box-shadow: var(--shadow); display: flex; flex-direction: column; gap: 12px; }
    h2 { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }
    p { font-size: 15px; line-height: 1.5; color: var(--muted); }
    .check { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 600; }
    .actions { display: flex; gap: 10px; flex-wrap: wrap; }
    .fine { font-size: 12px; }
  `],
} )
export class InterestDialogComponent {
  private readonly shop = inject( ShopService );
  private readonly bag = inject( BagService );
  readonly domain = input.required<string>();
  readonly shopName = input.required<string>();
  readonly shopUrl = input( '' );
  readonly productUrl = input( '' );
  readonly productTitle = input( '' );
  readonly closed = output<void>();
  readonly notify = signal( false );
  readonly email = signal( '' );
  readonly busy = signal( false );
  readonly done = signal( false );
  readonly error = signal( '' );

  async send (): Promise<void> {
    this.busy.set( true );
    this.error.set( '' );
    try {
      await this.shop.interest( this.domain(), { productUrl: this.productUrl() || undefined, productTitle: this.productTitle() || undefined, sessionId: this.bag.sessionId, email: this.email() || undefined, notify: this.notify() } );
      this.done.set( true );
    } catch ( error ) {
      this.error.set( apiErrorMessage( error, "That didn't go through. Try again." ) );
    } finally {
      this.busy.set( false );
    }
  }
}
