import { isPlatformBrowser } from '@angular/common';
import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import {
  GoogleAuthProvider, OAuthProvider, User, getAuth, onAuthStateChanged, signInWithCustomToken, signInWithPopup, signOut,
} from 'firebase/auth';

import { startAuthentication, startRegistration } from '@simplewebauthn/browser';

import { environment } from '../../environments/environment';
import { MarketApiService } from './market-api.service';

export interface Passkey { id: string; name: string; createdAt: number | null; lastUsedAt: number | null }

/** Who is signing in: a shopper (on a store) or a merchant (on TODD Market). */
export type SignInContext = 'shopper' | 'merchant';

/**
 * One TODD identity across every store (handoff Part 2, "Sign in"): Firebase
 * Auth on the shared taliferrotech project, so the same person is the same
 * user in TODD and every other product.
 *
 * - Apple and Google use Firebase's own providers (enable both in the
 *   Firebase console; Apple needs the Services ID and key).
 * - Email gets a link and a 6-digit code from the Market backend, which
 *   checks the code and returns a custom token.
 *
 * Outside the browser (prerendering) this reports signed out, so public
 * pages build as their signed-out version.
 */
@Injectable( { providedIn: 'root' } )
export class MarketAuthService {
  private readonly api = inject( MarketApiService );
  private readonly isBrowser = isPlatformBrowser( inject( PLATFORM_ID ) );

  /** undefined while Firebase restores the session; null when signed out. */
  readonly user = signal<User | null | undefined>( undefined );
  readonly isSignedIn = computed( () => !!this.user() );
  readonly ready: Promise<User | null>;

  constructor () {
    if ( !this.isBrowser ) {
      this.user.set( null );
      this.ready = Promise.resolve( null );
      return;
    }
    if ( environment.devAuthUid ) {
      // Dev only (environment.devauth.ts): a stand-in user for market/dev/server.js.
      const uid = environment.devAuthUid;
      const fake = { uid, email: `${ uid }@dev.local`, displayName: uid, getIdToken: async () => `dev:${ uid }` } as unknown as User;
      this.user.set( fake );
      this.ready = Promise.resolve( fake );
      return;
    }
    const auth = getAuth();
    this.ready = auth.authStateReady().then( () => auth.currentUser );
    onAuthStateChanged( auth, ( user ) => this.user.set( user ) );
  }

  async signInWithGoogle (): Promise<void> {
    await signInWithPopup( getAuth(), new GoogleAuthProvider() );
  }

  async signInWithApple (): Promise<void> {
    const provider = new OAuthProvider( 'apple.com' );
    provider.addScope( 'email' );
    provider.addScope( 'name' );
    await signInWithPopup( getAuth(), provider );
  }

  /** Emails a sign-in link and a 6-digit code that expire in 10 minutes. */
  requestEmailCode ( email: string, context: SignInContext, next: string, store?: string ): Promise<{ sent: true }> {
    return this.api.post( '/auth/email-code', { email, context, next, store } );
  }

  /** Checks the code (typed, or from the emailed link) and signs in. */
  async verifyEmailCode ( email: string, code: string ): Promise<void> {
    const { token } = await this.api.post<{ token: string }>( '/auth/verify', { email, code } );
    await signInWithCustomToken( getAuth(), token );
  }

  /**
   * Passkeys are bound to market.taliferro.tech, so they're offered there
   * (and on localhost), not on a store's own domain.
   */
  passkeysAvailable (): boolean {
    if ( !this.isBrowser || typeof window.PublicKeyCredential === 'undefined' ) return false;
    return ['market.taliferro.tech', 'localhost'].includes( location.hostname );
  }

  /** Signs in with a passkey saved on this device or synced to it. */
  async signInWithPasskey (): Promise<void> {
    const { challengeId, options } = await this.api.post<{ challengeId: string; options: Parameters<typeof startAuthentication>[0]['optionsJSON'] }>( '/auth/passkey/options' );
    const response = await startAuthentication( { optionsJSON: options } );
    const { token } = await this.api.post<{ token: string }>( '/auth/passkey/verify', { challengeId, response } );
    await signInWithCustomToken( getAuth(), token );
  }

  /** Adds a passkey to the signed-in account. */
  async addPasskey (): Promise<Passkey> {
    const { challengeId, options } = await this.api.post<{ challengeId: string; options: Parameters<typeof startRegistration>[0]['optionsJSON'] }>( '/account/passkeys/options' );
    const response = await startRegistration( { optionsJSON: options } );
    return this.api.post<Passkey>( '/account/passkeys', { challengeId, response } );
  }

  async listPasskeys (): Promise<Passkey[]> {
    return ( await this.api.get<{ passkeys: Passkey[] }>( '/account/passkeys' ) ).passkeys;
  }

  async removePasskey ( id: string ): Promise<void> {
    await this.api.delete( `/account/passkeys/${ encodeURIComponent( id ) }` );
  }

  async signOut (): Promise<void> {
    if ( this.isBrowser ) await signOut( getAuth() );
  }
}
