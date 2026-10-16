import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';

import { environment } from '../../environments/environment';

/**
 * Every call to the Market backend (todd-backend/functions/market). Same
 * origin: Hosting rewrites /api/** to the marketApi function, and
 * idTokenInterceptor adds the signed-in person's Firebase ID token.
 */
@Injectable( { providedIn: 'root' } )
export class MarketApiService {
  private readonly http = inject( HttpClient );
  private readonly base = environment.apiBase;

  get<T> ( path: string, params?: Record<string, string | number | boolean | undefined> ): Promise<T> {
    let httpParams = new HttpParams();
    for ( const [key, value] of Object.entries( params || {} ) ) {
      if ( value !== undefined && value !== '' ) httpParams = httpParams.set( key, String( value ) );
    }
    return firstValueFrom( this.http.get<T>( `${ this.base }${ path }`, { params: httpParams } ) );
  }

  post<T> ( path: string, body: unknown = {} ): Promise<T> {
    return firstValueFrom( this.http.post<T>( `${ this.base }${ path }`, body ) );
  }

  put<T> ( path: string, body: unknown = {} ): Promise<T> {
    return firstValueFrom( this.http.put<T>( `${ this.base }${ path }`, body ) );
  }

  patch<T> ( path: string, body: unknown = {} ): Promise<T> {
    return firstValueFrom( this.http.patch<T>( `${ this.base }${ path }`, body ) );
  }

  delete<T> ( path: string ): Promise<T> {
    return firstValueFrom( this.http.delete<T>( `${ this.base }${ path }` ) );
  }
}

/** The message to show for a failed call: the backend's `error`, else a plain fallback. */
export function apiErrorMessage ( error: unknown, fallback = 'Something went wrong. Try again.' ): string {
  const body = ( error as { error?: { error?: string } } )?.error;
  return typeof body?.error === 'string' && body.error ? body.error : fallback;
}
