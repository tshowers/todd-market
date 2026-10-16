import { StoreSettings } from '../models/merchant.model';

/**
 * The return policy as shoppers read it. Twin of
 * todd-backend/functions/market/services/policy.js; keep them in step.
 */
export function policySentence ( returns: Partial<StoreSettings['returns']> | null | undefined ): string {
  const r = returns || {};
  if ( !r.windowDays ) return 'All sales are final.';
  const parts = [`Returns accepted within ${ r.windowDays } days of delivery.`];
  if ( r.requireTags ) parts.push( 'Items must be unworn with tags attached.' );
  parts.push( r.shopperPaysShipping ? 'Return shipping is paid by the shopper.' : 'Return shipping is free.' );
  const finals = ( r.finalSaleCategories || [] ).filter( Boolean );
  if ( finals.length ) {
    const list = finals.length === 1 ? finals[0] : `${ finals.slice( 0, -1 ).join( ', ' ) } and ${ finals[finals.length - 1] }`;
    parts.push( `${ list } ${ finals.length === 1 ? 'is' : 'are' } final sale.` );
  }
  return parts.join( ' ' );
}
