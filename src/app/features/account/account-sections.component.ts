import { TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { AccountService } from '../../services/account.service';
import { Address } from '../../services/checkout.service';
import { apiErrorMessage } from '../../services/market-api.service';

type Section = 'saved' | 'addresses' | 'payment-methods' | 'security';

/** Account: Saved · Addresses · Payment methods (stored by Stripe) · Sign-in & security. */
@Component( {
  selector: 'tm-account-sections',
  standalone: true,
  imports: [FormsModule, RouterLink, TitleCasePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @switch (section()) {
      @case ('saved') {
        <h1>Saved</h1>
        @for (s of saved(); track s.storeId + s.productId) {
          <a class="row" [routerLink]="['/s', s.storeSlug]" [queryParams]="{ product: s.productId }">@if (s.image) { <img [src]="s.image" alt=""> }<span><strong>{{ s.title }}</strong><span>{{ s.storeName }}</span></span></a>
        } @empty { <p class="muted">Items you save at any store show up here.</p> }
      }
      @case ('addresses') {
        <h1>Addresses</h1>
        @for (a of addresses(); track $index; let i = $index) {
          <div class="row addr"><span><strong>{{ a.name }}</strong><span>{{ a.line1 }}, {{ a.city }}, {{ a.state }} {{ a.postal_code }}</span></span><button type="button" class="tm-btn tm-btn--ghost" (click)="removeAddress(i)">Remove</button></div>
        } @empty { <p class="muted">No saved addresses yet.</p> }
        <form class="add" (ngSubmit)="addAddress()">
          <input class="tm-input" placeholder="Full name" name="n" [(ngModel)]="draft.name">
          <input class="tm-input" placeholder="Address" name="l" [(ngModel)]="draft.line1">
          <input class="tm-input" placeholder="City" name="c" [(ngModel)]="draft.city">
          <input class="tm-input" placeholder="State" maxlength="2" name="s" [(ngModel)]="draft.state">
          <input class="tm-input" placeholder="ZIP" name="z" [(ngModel)]="draft.postal_code">
          <button type="submit" class="tm-btn tm-btn--primary">Add address</button>
        </form>
      }
      @case ('payment-methods') {
        <h1>Payment methods</h1>
        @for (m of methods(); track m.id) {
          <div class="row addr"><span><strong>{{ m.brand | titlecase }} ending {{ m.last4 }}</strong><span>Expires {{ m.expMonth }}/{{ m.expYear }}</span></span><button type="button" class="tm-btn tm-btn--ghost" (click)="removeMethod(m.id)">Remove</button></div>
        } @empty { <p class="muted">No saved cards. Cards you use at checkout are stored by Stripe, never by TODD Market.</p> }
      }
      @case ('security') {
        <h1>Sign-in &amp; security</h1>
        <div class="row addr"><span><strong>Passkeys</strong><span>Sign in with Face ID or Touch ID instead of an email code. Coming soon.</span></span><span class="tm-tag">Soon</span></div>
        <div class="row addr"><span><strong>Sign-in methods</strong><span>Apple, Google, or a code sent to your email. All of them open the same TODD account.</span></span></div>
      }
    }
    @if (error()) { <p class="tm-error">{{ error() }}</p> }`,
  styles: [`
    :host { display: flex; flex-direction: column; gap: 10px; }
    h1 { font-size: 32px; font-weight: 700; letter-spacing: -0.02em; margin-bottom: 6px; }
    .row { display: flex; align-items: center; gap: 14px; padding: 14px 16px; border-radius: 20px; background: var(--surface); color: var(--text); }
    .row img { width: 48px; height: 48px; border-radius: 12px; object-fit: cover; }
    .row > span { display: flex; flex-direction: column; font-size: 14px; flex: 1; }
    .row > span span { font-size: 13px; color: var(--muted); }
    .add { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding-top: 8px; }
    .add button { grid-column: 1 / -1; justify-self: start; }
    .muted { color: var(--muted); font-size: 14px; }
  `],
} )
export class AccountSectionsComponent implements OnInit {
  private readonly route = inject( ActivatedRoute );
  private readonly account = inject( AccountService );
  readonly section = signal<Section>( 'saved' );
  readonly saved = signal<{ storeId: string; productId: string; title: string; storeName: string; storeSlug: string; image: string | null }[]>( [] );
  readonly addresses = signal<Address[]>( [] );
  readonly methods = signal<{ id: string; brand: string; last4: string; expMonth: number; expYear: number }[]>( [] );
  readonly error = signal( '' );
  draft: Address = { name: '', phone: '', line1: '', city: '', state: '', postal_code: '' };

  async ngOnInit (): Promise<void> {
    this.section.set( this.route.snapshot.data['section'] as Section );
    try {
      if ( this.section() === 'payment-methods' ) this.methods.set( ( await this.account.paymentMethods() ).methods );
      else if ( this.section() !== 'security' ) {
        const profile = await this.account.profile();
        this.saved.set( profile.saved );
        this.addresses.set( profile.addresses );
      }
    } catch ( error ) {
      this.error.set( apiErrorMessage( error ) );
    }
  }

  async addAddress (): Promise<void> {
    if ( !this.draft.name || !this.draft.line1 ) return;
    await this.saveAddresses( [...this.addresses(), { ...this.draft, state: this.draft.state.toUpperCase() }] );
    this.draft = { name: '', phone: '', line1: '', city: '', state: '', postal_code: '' };
  }

  async removeAddress ( index: number ): Promise<void> {
    await this.saveAddresses( this.addresses().filter( ( _, i ) => i !== index ) );
  }

  async removeMethod ( id: string ): Promise<void> {
    try {
      await this.account.removePaymentMethod( id );
      this.methods.update( ( list ) => list.filter( ( m ) => m.id !== id ) );
    } catch ( error ) {
      this.error.set( apiErrorMessage( error ) );
    }
  }

  private async saveAddresses ( list: Address[] ): Promise<void> {
    try {
      this.addresses.set( ( await this.account.saveAddresses( list ) ).addresses );
    } catch ( error ) {
      this.error.set( apiErrorMessage( error ) );
    }
  }
}
