import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

import { environment } from '../../environments/environment';

export interface SeoPage {
  title: string;
  description: string;
  /** Path on market.taliferro.tech, for og:url. The canonical link follows the router (canonical-url.ts). */
  path: string;
  /** Leave the page out of search results (account, sign in, stores in draft). */
  noindex?: boolean;
}

/** Title, description and social tags for a page; works while prerendering. */
@Injectable( { providedIn: 'root' } )
export class SeoService {
  private readonly title = inject( Title );
  private readonly meta = inject( Meta );
  private readonly document = inject( DOCUMENT );

  set ( page: SeoPage ): void {
    const url = `${ environment.PLATFORM_URL }${ page.path === '/' ? '/' : page.path }`;
    this.title.setTitle( page.title );
    this.meta.updateTag( { name: 'description', content: page.description } );
    this.meta.updateTag( { property: 'og:title', content: page.title } );
    this.meta.updateTag( { property: 'og:description', content: page.description } );
    this.meta.updateTag( { property: 'og:url', content: url } );
    this.meta.updateTag( { name: 'robots', content: page.noindex ? 'noindex, nofollow' : 'index, follow' } );
  }

  /** Structured data (schema.org JSON-LD) for the page; one block per id. */
  setJsonLd ( id: string, data: object ): void {
    let script = this.document.getElementById( id ) as HTMLScriptElement | null;
    if ( !script ) {
      script = this.document.createElement( 'script' );
      script.type = 'application/ld+json';
      script.id = id;
      this.document.head.appendChild( script );
    }
    script.textContent = JSON.stringify( data ).replace( /</g, '\\u003c' );
  }
}
