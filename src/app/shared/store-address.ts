import { environment } from '../../environments/environment';

/**
 * A store's public address. v1 uses paths on the Market site
 * (market.taliferro.tech/s/<slug>); the design's <name>.toddmarket.com
 * subdomains come later.
 */
export function storeAddress ( slug: string ): string {
  return `${ environment.PLATFORM_URL.replace( /^https?:\/\//, '' ) }/s/${ slug }`;
}
