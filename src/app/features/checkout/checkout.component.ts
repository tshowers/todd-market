import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit, PLATFORM_ID, computed, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Stripe, StripeElements, loadStripe } from '@stripe/stripe-js';

import { environment } from '../../../environments/environment';
import { PublicStore } from '../../models/storefront.model';
import { BagService } from '../../services/bag.service';
import { Address, CheckoutService, Quote } from '../../services/checkout.service';
import { apiErrorMessage } from '../../services/market-api.service';
import { MarketAuthService } from '../../services/market-auth.service';
import { SeoService } from '../../services/seo.service';
import { StorefrontService } from '../../services/storefront.service';
import { brandStyle } from '../../shared/brand/brand-tuning';
import { MoneyPipe } from '../../shared/money.pipe';

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

/**
 * Checkout (f06, m16). One card entry; each store charges its own items on
 * its own Stripe account (the plan's merchant-of-record decision), so the
 * copy says "1 checkout", not "1 payment".
 */
@Component( {
  selector: 'tm-checkout',
  standalone: true,
  imports: [FormsModule, RouterLink, MoneyPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'tt-page' },
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css',
} )
export class CheckoutComponent implements OnInit, OnDestroy {
  private readonly route = inject( ActivatedRoute );
  private readonly router = inject( Router );
  private readonly storefront = inject( StorefrontService );
  private readonly checkout = inject( CheckoutService );
  private readonly auth = inject( MarketAuthService );
  private readonly isBrowser = isPlatformBrowser( inject( PLATFORM_ID ) );
  readonly bag = inject( BagService );
  private readonly paymentHost = viewChild<ElementRef<HTMLElement>>( 'payment' );

  readonly store = signal<PublicStore | null>( null );
  readonly email = signal( '' );
  readonly signedInEmail = signal( '' );
  readonly address = signal<Address>( { name: '', phone: '', line1: '', city: '', state: '', postal_code: '' } );
  readonly shipping = signal<Record<string, string>>( {} );
  readonly quote = signal<Quote | null>( null );
  readonly quoting = signal( false );
  readonly paying = signal( false );
  readonly cardReady = signal( false );
  readonly error = signal( '' );
  readonly emailError = signal( false );

  private stripe: Stripe | null = null;
  private elements: StripeElements | null = null;
  private quoteTimer: ReturnType<typeof setTimeout> | null = null;

  readonly style = computed( () => brandStyle( this.store()?.brand.tuned ) );
  readonly storeCount = computed( () => this.bag.groups().length );
  readonly ready = computed( () => {
    const a = this.address();
    return EMAIL.test( this.email().trim() ) && !!( a.name && a.line1 && a.city && a.state && a.postal_code );
  } );
  readonly subtotal = computed( () => this.quote()?.parts.reduce( ( s, p ) => s + p.subtotalCents, 0 ) ?? this.bag.totalCents() );
  readonly shippingTotal = computed( () => this.quote()?.parts.reduce( ( s, p ) => s + p.shippingCents, 0 ) ?? null );
  readonly taxTotal = computed( () => this.quote()?.parts.reduce( ( s, p ) => s + p.taxCents, 0 ) ?? null );
  readonly referredStores = computed( () => this.bag.groups().filter( ( g ) => g.storeId !== this.store()?.id ).map( ( g ) => g.storeName ) );

  constructor () {
    inject( SeoService ).set( { title: 'Checkout | 16Ahead Store', description: 'Checkout', path: '/checkout', noindex: true } );
  }

  async ngOnInit (): Promise<void> {
    const slug = this.route.snapshot.paramMap.get( 'slug' ) || '';
    this.store.set( await this.storefront.store( slug ).catch( () => null ) );
    const user = await this.auth.ready;
    if ( user?.email ) {
      this.email.set( user.email );
      this.signedInEmail.set( user.email );
    }
    if ( this.isBrowser && environment.stripePublishableKey.startsWith( 'pk_' ) && !environment.stripePublishableKey.includes( 'REPLACE' ) ) {
      this.stripe = await loadStripe( environment.stripePublishableKey );
    }
  }

  ngOnDestroy (): void {
    if ( this.quoteTimer ) clearTimeout( this.quoteTimer );
  }

  setAddress ( key: keyof Address, value: string ): void {
    this.address.update( ( a ) => ( { ...a, [key]: value } ) );
    this.scheduleQuote();
  }

  setEmail ( value: string ): void {
    this.email.set( value );
    this.emailError.set( false );
    this.scheduleQuote();
  }

  chooseShipping ( storeId: string, rateId: string ): void {
    this.shipping.update( ( s ) => ( { ...s, [storeId]: rateId } ) );
    this.scheduleQuote( 0 );
  }

  rateFor ( storeId: string ): string {
    return this.shipping()[storeId] || this.quote()?.parts.find( ( p ) => p.storeId === storeId )?.shippingRate?.id || '';
  }

  partFor ( storeId: string ) {
    return this.quote()?.parts.find( ( p ) => p.storeId === storeId ) || null;
  }

  async pay (): Promise<void> {
    this.error.set( '' );
    if ( !EMAIL.test( this.email().trim() ) ) { this.emailError.set( true ); return; }
    const quote = this.quote();
    if ( !quote || !this.stripe || !this.elements ) { this.error.set( 'Fill in your delivery details first.' ); return; }
    this.paying.set( true );
    try {
      const { error: submitError } = await this.elements.submit();
      if ( submitError ) throw new Error( submitError.message || 'Enter your card number to continue.' );
      const { error } = await this.stripe.confirmSetup( {
        elements: this.elements,
        clientSecret: quote.clientSecret!,
        redirect: 'if_required',
        confirmParams: { return_url: `${ location.origin }/order/${ quote.orderId }` },
      } );
      if ( error ) throw new Error( error.message || 'Your card was declined. Try another card.' );

      let result = await this.checkout.pay( quote.orderId );
      if ( result.status === 'needs_action' ) {
        // 3D Secure, one store at a time, each on that store's account.
        for ( const action of result.actions ) {
          const storeStripe = await loadStripe( environment.stripePublishableKey, { stripeAccount: action.accountId } );
          const { error: actionError } = await storeStripe!.handleNextAction( { clientSecret: action.clientSecret } );
          if ( actionError ) break;
        }
        result = await this.checkout.finalize( quote.orderId );
      }
      if ( result.status === 'paid' ) {
        this.bag.clear();
        await this.router.navigate( ['/order', quote.orderId] );
        return;
      }
      if ( result.status === 'failed' ) {
        this.quote.set( null );
        this.cardReady.set( false );
        this.scheduleQuote( 0 );
        throw new Error( result.error );
      }
      throw new Error( 'Your payment is still processing. Check your email for a receipt in a minute.' );
    } catch ( error ) {
      this.error.set( error instanceof Error ? error.message : apiErrorMessage( error ) );
    } finally {
      this.paying.set( false );
    }
  }

  private scheduleQuote ( delay = 600 ): void {
    if ( this.quoteTimer ) clearTimeout( this.quoteTimer );
    this.quoteTimer = setTimeout( () => void this.refreshQuote(), delay );
  }

  private async refreshQuote (): Promise<void> {
    if ( !this.ready() || !this.bag.count() ) return;
    this.quoting.set( true );
    this.error.set( '' );
    const body = { email: this.email().trim(), address: this.address(), lines: CheckoutService.lines( this.bag.items() ), shipping: this.shipping() };
    try {
      const current = this.quote();
      const next = current ? { ...current, ...( await this.checkout.update( current.orderId, body ) ) } : await this.checkout.start( body );
      this.quote.set( next );
      if ( !current ) this.mountCard( next.clientSecret! );
    } catch ( error ) {
      this.error.set( apiErrorMessage( error, "We couldn't price your order. Check your details." ) );
    } finally {
      this.quoting.set( false );
    }
  }

  private mountCard ( clientSecret: string ): void {
    const host = this.paymentHost()?.nativeElement;
    if ( !this.stripe || !host ) {
      this.error.set( 'Card payments are not set up on this site yet.' );
      return;
    }
    const dark = document.documentElement.getAttribute( 'data-theme' ) === 'dark' ||
      ( !document.documentElement.hasAttribute( 'data-theme' ) && matchMedia( '(prefers-color-scheme: dark)' ).matches );
    this.elements = this.stripe.elements( {
      clientSecret,
      appearance: {
        theme: dark ? 'night' : 'stripe',
        variables: { borderRadius: '999px', fontFamily: '"Helvetica Neue", Helvetica, Arial, sans-serif', colorPrimary: dark ? '#3d7bff' : '#2f6bff' },
      },
    } );
    const element = this.elements.create( 'payment', { layout: 'tabs', wallets: { applePay: 'auto', googlePay: 'auto' } } );
    element.on( 'ready', () => this.cardReady.set( true ) );
    element.mount( host );
  }
}
