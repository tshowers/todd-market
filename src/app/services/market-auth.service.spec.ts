import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { ActivatedRouteSnapshot, RouterStateSnapshot, UrlTree, provideRouter } from '@angular/router';
import { User } from 'firebase/auth';

import { environment } from '../../environments/environment';
import { signedInGuard } from './auth.guard';
import { MarketAuthService } from './market-auth.service';

// The dev stand-in user (environment.devAuthUid) lets this run without Firebase.
describe( 'MarketAuthService.ready', () => {
  const devAuthUid = environment.devAuthUid;
  let auth: MarketAuthService;

  beforeEach( () => {
    environment.devAuthUid = 'shopper1';
    sessionStorage.setItem( 'tm-dev-signed-out', '1' );
    TestBed.configureTestingModule( { providers: [provideHttpClient(), provideRouter( [] )] } );
    auth = TestBed.inject( MarketAuthService );
  } );

  afterEach( () => {
    environment.devAuthUid = devAuthUid;
    sessionStorage.removeItem( 'tm-dev-signed-out' );
  } );

  it( 'follows a sign-in made after the page loaded, so the guard lets them through', async () => {
    expect( await auth.ready ).toBeNull();
    // Signing in on the sign-in page (email code, Google, Apple, passkey).
    auth.user.set( { uid: 'shopper1' } as User );
    expect( ( await auth.ready )?.uid ).toBe( 'shopper1' );
    const result = await TestBed.runInInjectionContext( () => signedInGuard( {} as ActivatedRouteSnapshot, { url: '/account' } as RouterStateSnapshot ) );
    expect( result ).toBeTrue();
  } );

  it( 'follows a sign-out, so the guard sends them to sign in', async () => {
    auth.user.set( { uid: 'shopper1' } as User );
    expect( await auth.ready ).not.toBeNull();
    await auth.signOut();
    const result = await TestBed.runInInjectionContext( () => signedInGuard( {} as ActivatedRouteSnapshot, { url: '/app' } as RouterStateSnapshot ) );
    expect( result instanceof UrlTree ).toBeTrue();
    expect( String( result ) ).toBe( '/sign-in?as=merchant&next=%2Fapp' );
  } );
} );
