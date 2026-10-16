import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { initializeApp } from 'firebase/app';

import { routes } from './app.routes';
import { environment } from '../environments/environment';
import { idTokenInterceptor } from './core/interceptors/id-token.interceptor';
import { provideCanonicalUrl } from './shared/canonical-url';

initializeApp( environment.firebaseConfig );

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection( { eventCoalescing: true } ),
    provideRouter( routes, withInMemoryScrolling( { anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled' } ) ),
    provideCanonicalUrl(),
    // No hydration: signed-in visitors see a different header than the
    // prerendered page (PRODUCT-STANDARD part 4), so the browser renders fresh.
    provideHttpClient( withFetch(), withInterceptors( [idTokenInterceptor] ) ),
  ],
};
