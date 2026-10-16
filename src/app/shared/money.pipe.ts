import { Pipe, PipeTransform } from '@angular/core';

/** Cents → "$298" or "$328.35" (whole dollars drop the cents, like the design). */
@Pipe( { name: 'money', standalone: true } )
export class MoneyPipe implements PipeTransform {
  transform ( cents: number | null | undefined, always = false ): string {
    if ( cents == null ) return '';
    const dollars = cents / 100;
    const whole = Number.isInteger( dollars ) && !always;
    return ( dollars < 0 ? '−$' : '$' ) + Math.abs( dollars ).toLocaleString( 'en-US', { minimumFractionDigits: whole ? 0 : 2, maximumFractionDigits: 2 } );
  }
}
