import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { MarketAuthService } from './market-auth.service';

/** Signed-in pages: anyone else goes to sign in, then comes back. */
export const signedInGuard: CanActivateFn = async ( route, state ) => {
  const auth = inject( MarketAuthService );
  const router = inject( Router );
  const user = await auth.ready;
  if ( user ) return true;
  const as = state.url.startsWith( '/app' ) || state.url.startsWith( '/claim' ) || state.url.startsWith( '/shippo-oauth-redirect' ) ? 'merchant' : 'shopper';
  return router.createUrlTree( ['/sign-in'], { queryParams: { as, next: state.url } } );
};
