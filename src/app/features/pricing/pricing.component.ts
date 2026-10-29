import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PLATFORM_FEE_PCT, REFERRAL_RATE_RANGE } from '../../models/market.constants';
import { SeoService } from '../../services/seo.service';
import { PublicFooterComponent } from '../../shared/public-footer/public-footer.component';
import { PublicHeaderComponent } from '../../shared/public-header/public-header.component';

/** Stripe's standard US card rate, as an example (the calculator's note says so). */
const CARD_PCT = 0.029;
const CARD_FIXED = 0.3;
const AVERAGE_ORDER = 120;
const AVERAGE_REFERRAL_RATE = 0.1;

const money = ( n: number ) => '$' + n.toLocaleString( 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 } );

/**
 * Pricing (handoff Part 2: f04, m14), reworded for the per-order fee: no
 * monthly plan; TODD Market takes PLATFORM_FEE_PCT of each order's
 * merchandise total. Numbers are samples until launch (the yellow tag says so).
 */
@Component( {
  selector: 'tm-pricing',
  standalone: true,
  imports: [RouterLink, PublicHeaderComponent, PublicFooterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'tt-page' },
  templateUrl: './pricing.component.html',
  styleUrl: './pricing.component.css',
} )
export class PricingComponent {
  readonly feePct = PLATFORM_FEE_PCT;
  readonly sales = signal( 12000 );
  readonly referralSales = signal( 2500 );
  readonly openFaq = signal( 0 );

  readonly parts = [
    { tag: 'Per order', tint: 'blue', big: `${ PLATFORM_FEE_PCT }%`, body: 'No monthly plan. Your storefront, the AI that builds and updates it, the iPhone app, and listings shopping agents can read. Charged on the item total of each order, not tax or shipping.' },
    { tag: 'Payments', tint: 'cyan', big: "Stripe's rate", body: "Card fees go to Stripe on each sale, at Stripe's standard rate for your account. 16Ahead Store's fee is separate and applies only to orders." },
    { tag: 'Referrals', tint: 'green', big: `${ REFERRAL_RATE_RANGE.min }–${ REFERRAL_RATE_RANGE.max }%`, body: 'Paid only when a shopper another store sent you buys. You set the rate you pay and the minimum you accept.' },
  ];

  readonly rows = computed( () => {
    const sales = this.sales();
    const fee = sales * PLATFORM_FEE_PCT / 100;
    const cards = sales * CARD_PCT + Math.round( sales / AVERAGE_ORDER ) * CARD_FIXED;
    const earned = this.referralSales() * AVERAGE_REFERRAL_RATE;
    return {
      list: [
        { label: `16Ahead Store fee (${ PLATFORM_FEE_PCT }%)`, value: '−' + money( fee ), good: false },
        { label: 'Card fees to Stripe (example)', value: '−' + money( cards ), good: false },
        { label: 'Referral earnings', value: '+' + money( earned ), good: true },
      ],
      net: ( earned - fee - cards >= 0 ? '+' : '−' ) + money( Math.abs( earned - fee - cards ) ) + ' / mo',
    };
  } );

  readonly salesLabel = computed( () => '$' + this.sales().toLocaleString( 'en-US' ) );
  readonly referralLabel = computed( () => '$' + this.referralSales().toLocaleString( 'en-US' ) );

  readonly faqs = [
    { q: 'Is there a setup fee or a monthly plan?', a: `No. Import, build and review are free, and there's no monthly plan. 16Ahead Store takes ${ PLATFORM_FEE_PCT }% of each order's item total, and only when you sell.` },
    { q: 'Who pays the referral commission?', a: "The store that makes the sale pays the store that sent the shopper, at the selling store's rate. It's settled through Stripe and paid out on the 1st of each month." },
    { q: 'What if a referred order is returned?', a: "Commission is held until the selling store's return window closes. If the item comes back before then, the commission is cancelled. After that, it's final." },
    { q: 'Can I leave the referral network?', a: 'Yes. You can stop sending shoppers, stop receiving them, or both, from the referral dashboard.' },
    { q: 'Why do I need to verify my identity?', a: 'The law requires identity and business checks for anyone who takes card payments. Stripe runs them. 16Ahead Store never stores your ID.' },
  ];

  constructor () {
    inject( SeoService ).set( {
      title: '16Ahead Store Pricing: a small fee per order, no monthly plan',
      description: `No monthly plan. 16Ahead Store takes ${ PLATFORM_FEE_PCT }% of each order, Stripe charges its card fees, and referrals pay only when a referred shopper buys.`,
      path: '/pricing',
    } );
  }

  toggle ( index: number ): void {
    this.openFaq.update( ( open ) => open === index ? -1 : index );
  }

  num ( event: Event ): number {
    return Number( ( event.target as HTMLInputElement ).value );
  }
}
