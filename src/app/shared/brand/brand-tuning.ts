import { Palette, TunedBrand } from '../../models/merchant.model';

/**
 * TypeScript twin of todd-backend/functions/market/services/brandTuning.js,
 * for the Brand step's live preview. The server's result is what's saved;
 * both are tested against the same fixtures (brand-tuning.spec.ts and
 * brandTuning.test.js), so keep them in step.
 */
const MIN_CONTRAST = 4.5;

interface Rgb { r: number; g: number; b: number }
interface Hsl { h: number; s: number; l: number }

function hexToRgb ( hex: string ): Rgb {
  let value = String( hex || '' ).trim().replace( /^#/, '' );
  if ( /^[0-9a-f]{3}$/i.test( value ) ) value = value.split( '' ).map( ( c ) => c + c ).join( '' );
  if ( !/^[0-9a-f]{6}$/i.test( value ) ) throw new Error( `Not a hex colour: ${ hex }` );
  return { r: parseInt( value.slice( 0, 2 ), 16 ), g: parseInt( value.slice( 2, 4 ), 16 ), b: parseInt( value.slice( 4, 6 ), 16 ) };
}

function rgbToHex ( { r, g, b }: Rgb ): string {
  return '#' + [r, g, b].map( ( v ) => Math.round( Math.max( 0, Math.min( 255, v ) ) ).toString( 16 ).padStart( 2, '0' ) ).join( '' );
}

function rgbToHsl ( { r, g, b }: Rgb ): Hsl {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max( rn, gn, bn ), min = Math.min( rn, gn, bn );
  const l = ( max + min ) / 2;
  let h = 0, s = 0;
  if ( max !== min ) {
    const d = max - min;
    s = l > 0.5 ? d / ( 2 - max - min ) : d / ( max + min );
    if ( max === rn ) h = ( gn - bn ) / d + ( gn < bn ? 6 : 0 );
    else if ( max === gn ) h = ( bn - rn ) / d + 2;
    else h = ( rn - gn ) / d + 4;
    h *= 60;
  }
  return { h, s: s * 100, l: l * 100 };
}

function hslToHex ( { h, s, l }: Hsl ): string {
  const sn = Math.max( 0, Math.min( 100, s ) ) / 100;
  const ln = Math.max( 0, Math.min( 100, l ) ) / 100;
  const k = ( n: number ) => ( n + h / 30 ) % 12;
  const a = sn * Math.min( ln, 1 - ln );
  const f = ( n: number ) => ln - a * Math.max( -1, Math.min( k( n ) - 3, Math.min( 9 - k( n ), 1 ) ) );
  return rgbToHex( { r: f( 0 ) * 255, g: f( 8 ) * 255, b: f( 4 ) * 255 } );
}

function luminance ( hex: string ): number {
  const { r, g, b } = hexToRgb( hex );
  const lin = ( v: number ) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow( ( c + 0.055 ) / 1.055, 2.4 );
  };
  return 0.2126 * lin( r ) + 0.7152 * lin( g ) + 0.0722 * lin( b );
}

export function contrast ( a: string, b: string ): number {
  const la = luminance( a ), lb = luminance( b );
  return ( Math.max( la, lb ) + 0.05 ) / ( Math.min( la, lb ) + 0.05 );
}

function walkLightness ( h: number, s: number, start: number, step: number, against: string ): { hex: string; l: number } {
  let l = start;
  let hex = hslToHex( { h, s, l } );
  while ( contrast( hex, against ) < MIN_CONTRAST && ( step < 0 ? l > 0 : l < 100 ) ) {
    l += step;
    hex = hslToHex( { h, s, l } );
  }
  return { hex, l };
}

export function colorName ( hex: string ): string {
  const { h, s, l } = rgbToHsl( hexToRgb( hex ) );
  if ( s < 12 ) return l > 85 ? 'white' : l < 15 ? 'black' : 'grey';
  if ( l < 22 && s < 20 ) return 'charcoal';
  if ( h < 12 || h >= 345 ) return l > 70 ? 'pink' : l < 35 ? 'burgundy' : 'red';
  if ( h < 40 ) return l < 35 ? 'brown' : l > 75 ? 'peach' : 'orange';
  if ( h < 65 ) return l < 40 ? 'olive' : 'gold';
  if ( h < 160 ) return l < 30 ? 'forest' : 'green';
  if ( h < 200 ) return 'teal';
  if ( h < 250 ) return l < 30 ? 'navy' : 'blue';
  if ( h < 290 ) return l < 40 ? 'indigo' : 'violet';
  if ( h < 320 ) return l < 40 ? 'plum' : 'purple';
  return l < 35 ? 'plum' : 'rose';
}

export function tuneBrand ( palette: Pick<Palette, 'main' | 'accent'> ): TunedBrand {
  const main = rgbToHsl( hexToRgb( palette.main ) );
  const second = rgbToHsl( hexToRgb( palette.accent ) );
  const mainHex = rgbToHex( hexToRgb( palette.main ) );

  const accent = walkLightness( main.h, main.s, main.l, -1, '#ffffff' );
  const tintLight = hslToHex( { h: main.h, s: Math.min( main.s, 70 ), l: 94 } );
  const tintDark = hslToHex( { h: main.h, s: Math.min( main.s, 45 ), l: 16 } );
  const tintFgLight = walkLightness( second.h, second.s, 34, -1, tintLight ).hex;
  const tintFgDark = walkLightness( main.h, main.s, 72, +1, tintDark ).hex;

  const shift = Math.round( main.l - accent.l );
  const mainName = colorName( palette.main );
  const secondName = colorName( palette.accent );
  const capital = ( word: string ) => word.charAt( 0 ).toUpperCase() + word.slice( 1 );

  return {
    accent: accent.hex, tintLight, tintDark, tintFgLight, tintFgDark,
    accentShiftPct: Math.max( 0, shift ),
    notes: [
      shift > 0
        ? `Your ${ mainName } is ${ shift }% deeper on buttons (${ mainHex } → ${ accent.hex }) so white text stays readable.`
        : 'Your main color works on buttons as is.',
      `${ capital( secondName ) } becomes the text on ${ mainName } tags, and dark mode gets a lighter version of each.`,
      "Pages stay white or near-black like the rest of Find, so your background color isn't used for pages.",
      'Links and the network dot stay Find blue, so shoppers recognize a referral in any store.',
    ],
  };
}

/** The CSS variables a store's pages use: --accent on buttons, tag tints per theme. */
export function brandStyle ( tuned: TunedBrand | null | undefined ): Record<string, string> {
  if ( !tuned ) return {};
  return {
    '--accent': tuned.accent,
    '--brand-tint-light': tuned.tintLight,
    '--brand-tint-fg-light': tuned.tintFgLight,
    '--brand-tint-dark': tuned.tintDark,
    '--brand-tint-fg-dark': tuned.tintFgDark,
  };
}
