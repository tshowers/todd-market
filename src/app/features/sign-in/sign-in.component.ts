import {
  ChangeDetectionStrategy, Component, ElementRef, OnInit, computed, inject, signal, viewChildren,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { apiErrorMessage, MarketApiService } from '../../services/market-api.service';
import { MarketAuthService, SignInContext } from '../../services/market-auth.service';
import { SeoService } from '../../services/seo.service';
import { IconComponent } from '../../shared/icon/icon.component';
import { PublicHeaderComponent } from '../../shared/public-header/public-header.component';

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

interface StoreHeader { name: string; initial: string; tint: string; tintFg: string; logoUrl?: string }

/**
 * Sign in (handoff Part 2: f01–f03, m13). Shoppers sign in on a store
 * (?as=shopper&store=<slug>), merchants on TODD Market (?as=merchant).
 * /sign-in/verify?email=&code= is where the emailed link lands.
 */
@Component( {
  selector: 'tm-sign-in',
  standalone: true,
  imports: [FormsModule, RouterLink, IconComponent, PublicHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'tt-page' },
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.css',
} )
export class SignInComponent implements OnInit {
  private readonly auth = inject( MarketAuthService );
  private readonly api = inject( MarketApiService );
  private readonly route = inject( ActivatedRoute );
  private readonly router = inject( Router );
  private readonly cells = viewChildren<ElementRef<HTMLInputElement>>( 'cell' );

  readonly mode = signal<SignInContext>( 'merchant' );
  readonly step = signal<'form' | 'sent'>( 'form' );
  readonly email = signal( '' );
  readonly emailError = signal( false );
  readonly code = signal<string[]>( ['', '', '', '', '', ''] );
  readonly busy = signal( false );
  readonly error = signal( '' );
  readonly store = signal<StoreHeader | null>( null );
  private storeSlug = '';
  private next = '';

  readonly title = computed( () => this.mode() === 'shopper'
    ? `Sign in to shop ${ this.store()?.name || 'the network' }`
    : 'Sign in to TODD Market' );
  readonly subtitle = computed( () => this.mode() === 'shopper'
    ? 'Your TODD account works at every store in the network, with your orders, addresses and returns in one place.'
    : 'Manage your store, referrals and payouts.' );
  readonly codeComplete = computed( () => this.code().every( ( digit ) => /^\d$/.test( digit ) ) );

  constructor () {
    inject( SeoService ).set( { title: 'Sign in | TODD Market', description: 'Sign in to TODD Market.', path: '/sign-in', noindex: true } );
  }

  async ngOnInit (): Promise<void> {
    const params = this.route.snapshot.queryParamMap;
    this.mode.set( params.get( 'as' ) === 'shopper' ? 'shopper' : 'merchant' );
    this.next = safeNext( params.get( 'next' ) ) || ( this.mode() === 'shopper' ? '/account' : '/app' );
    this.storeSlug = params.get( 'store' ) || '';
    if ( this.storeSlug ) void this.loadStore();

    // The emailed link: /sign-in/verify?email=…&code=…
    if ( this.route.snapshot.data['verify'] ) {
      const email = params.get( 'email' ) || '';
      const code = ( params.get( 'code' ) || '' ).replace( /\D/g, '' ).slice( 0, 6 );
      this.email.set( email );
      this.step.set( 'sent' );
      if ( email && code.length === 6 ) {
        this.code.set( code.split( '' ) );
        await this.verify();
      }
    }
  }

  setMode ( mode: SignInContext ): void {
    this.mode.set( mode );
    this.step.set( 'form' );
    this.emailError.set( false );
    this.error.set( '' );
  }

  readonly passkeys = this.auth.passkeysAvailable();

  async withPasskey (): Promise<void> {
    this.error.set( '' );
    try {
      await this.auth.signInWithPasskey();
      await this.router.navigateByUrl( this.next );
    } catch ( error ) {
      // Closing the system sheet isn't an error worth showing.
      if ( ( error as { name?: string } )?.name === 'NotAllowedError' ) return;
      this.error.set( apiErrorMessage( error, "That passkey didn't work. Try again or use your email." ) );
    }
  }

  async withProvider ( provider: 'apple' | 'google' ): Promise<void> {
    this.error.set( '' );
    try {
      await ( provider === 'apple' ? this.auth.signInWithApple() : this.auth.signInWithGoogle() );
      await this.router.navigateByUrl( this.next );
    } catch ( error ) {
      const code = ( error as { code?: string } )?.code || '';
      if ( code !== 'auth/popup-closed-by-user' && code !== 'auth/cancelled-popup-request' ) {
        this.error.set( `We couldn't sign you in with ${ provider === 'apple' ? 'Apple' : 'Google' }. Try again or use your email.` );
      }
    }
  }

  async sendLink (): Promise<void> {
    const email = this.email().trim();
    if ( !EMAIL.test( email ) ) {
      this.emailError.set( true );
      return;
    }
    this.busy.set( true );
    this.error.set( '' );
    try {
      await this.auth.requestEmailCode( email, this.mode(), this.next, this.storeSlug || undefined );
      this.email.set( email );
      this.code.set( ['', '', '', '', '', ''] );
      this.step.set( 'sent' );
      setTimeout( () => this.cells()[0]?.nativeElement.focus(), 0 );
    } catch ( error ) {
      this.error.set( apiErrorMessage( error, "We couldn't send the email. Try again in a minute." ) );
    } finally {
      this.busy.set( false );
    }
  }

  onCell ( index: number, event: Event ): void {
    const input = event.target as HTMLInputElement;
    const digits = input.value.replace( /\D/g, '' );
    const next = [...this.code()];
    if ( digits.length > 1 ) {
      // Pasted (or autofilled) the whole code.
      digits.slice( 0, 6 - index ).split( '' ).forEach( ( d, i ) => next[index + i] = d );
      this.code.set( next );
      this.cells()[Math.min( index + digits.length, 5 )]?.nativeElement.focus();
    } else {
      next[index] = digits;
      this.code.set( next );
      input.value = digits;
      if ( digits && index < 5 ) this.cells()[index + 1]?.nativeElement.focus();
    }
    if ( this.codeComplete() ) void this.verify();
  }

  onKey ( index: number, event: KeyboardEvent ): void {
    if ( event.key === 'Backspace' && !this.code()[index] && index > 0 ) this.cells()[index - 1]?.nativeElement.focus();
  }

  async verify (): Promise<void> {
    if ( !this.codeComplete() || this.busy() ) return;
    this.busy.set( true );
    this.error.set( '' );
    try {
      await this.auth.verifyEmailCode( this.email(), this.code().join( '' ) );
      await this.router.navigateByUrl( this.next );
    } catch ( error ) {
      this.error.set( apiErrorMessage( error, "That code didn't work. Check it, or send a new one." ) );
    } finally {
      this.busy.set( false );
    }
  }

  useDifferentEmail (): void {
    this.step.set( 'form' );
    this.error.set( '' );
  }

  private async loadStore (): Promise<void> {
    try {
      const store = await this.api.get<{ name: string; brand?: { logoUrl?: string; tuned?: { tintLight?: string; tintFgLight?: string } } }>(
        `/storefront/${ encodeURIComponent( this.storeSlug ) }/summary` );
      this.store.set( {
        name: store.name,
        initial: store.name.charAt( 0 ).toUpperCase(),
        tint: store.brand?.tuned?.tintLight || 'var(--t-pink)',
        tintFg: store.brand?.tuned?.tintFgLight || 'var(--t-pink-fg)',
        logoUrl: store.brand?.logoUrl,
      } );
    } catch {
      this.store.set( null );
    }
  }
}

/** Only same-site paths, so a crafted link can't send someone elsewhere after sign-in. */
function safeNext ( value: string | null ): string {
  return value && value.startsWith( '/' ) && !value.startsWith( '//' ) && !value.startsWith( '/\\' ) ? value : '';
}
