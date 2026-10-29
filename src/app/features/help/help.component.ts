import { isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, ElementRef, PLATFORM_ID, afterNextRender, inject, signal, viewChildren,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { SAMPLE_STORE_PATH } from '../../models/market.constants';
import { SeoService } from '../../services/seo.service';
import { PublicFooterComponent } from '../../shared/public-footer/public-footer.component';
import { PublicHeaderComponent } from '../../shared/public-header/public-header.component';

interface HelpStep {
  n: string;
  tint: string;
  title: string;
  copy: string;
  details: string[];
  action: string;
  route: string;
  query?: Record<string, string>;
}

/** TODD Market Help (handoff Part 2: e05, m12; same structure as Find's Help, 4f). Prerendered. */
@Component( {
  selector: 'tm-help',
  standalone: true,
  imports: [RouterLink, PublicHeaderComponent, PublicFooterComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'tt-page' },
  templateUrl: './help.component.html',
  styleUrl: './help.component.css',
} )
export class HelpComponent {
  private readonly cards = viewChildren<ElementRef<HTMLElement>>( 'stepCard' );
  readonly active = signal( 0 );

  readonly steps: HelpStep[] = [
    {
      n: '01', tint: 'blue', title: 'Import your catalog',
      copy: 'Connect Shopify or Salesforce Commerce, or upload a CSV file, photos and price sheets. 16Ahead Store reads products, sizes, colors, prices and stock.',
      details: ['Most catalogs finish in about a minute.', 'Products without a price are flagged for you to fix or hide.'],
      action: 'Open import', route: '/app/onboarding/import',
    },
    {
      n: '02', tint: 'cyan', title: 'Add your brand',
      copy: 'Upload your logo and pick your colors. We adjust them so buttons and tags stay readable inside Find in light and dark mode.',
      details: ['You see the original and adjusted colors side by side.', 'Links and the network dot stay Find blue so referrals are easy to recognize.'],
      action: 'Set up your brand', route: '/app/onboarding/brand',
    },
    {
      n: '03', tint: 'green', title: 'Review your store',
      copy: 'The AI writes descriptions, groups products into collections and drafts a home page. Change the voice, turn collections on or off, and fix anything it flags.',
      details: ['Nothing goes live until you publish.', 'You can change everything later.'],
      action: 'Review a store', route: '/app/onboarding/review',
    },
    {
      n: '04', tint: 'violet', title: 'Get paid with Stripe',
      copy: 'Payments run through Stripe in two parts. The first part lets you take orders. The second part, an ID check and a bank account, unlocks payouts.',
      details: [
        'The law requires identity and business checks for anyone who takes card payments. Stripe runs them, and 16Ahead Store never stores your ID.',
        'Sales wait in your Stripe balance until payouts are unlocked.',
      ],
      action: 'Set up payments', route: '/app/onboarding/get-paid',
    },
    {
      n: '05', tint: 'pink', title: 'How referrals work',
      copy: "When a shopper asks for something you don't carry, your store suggests a store in the network that does, in your store's voice. If the shopper buys, you earn that store's commission rate.",
      details: [
        'Referrals are always labeled, and the other store sets its own prices.',
        'Stores that send shoppers to you pay their rate when you make the sale.',
        "Your commission is final once the selling store's return window closes. If the item comes back before then, the commission is cancelled.",
      ],
      action: 'See a referral', route: SAMPLE_STORE_PATH, query: { q: 'Black cap-toe oxfords for the groom, size 11' },
    },
    {
      n: '06', tint: 'yellow', title: 'Control your referrals',
      copy: 'The referral dashboard shows shoppers you sent and received, what you earned and paid, and each store in your network.',
      details: [
        'Set a minimum commission.',
        'Block categories that compete with you, or block specific stores.',
        'Choose whether any network store can send you shoppers, or only stores you approve.',
      ],
      action: 'Open the dashboard', route: '/app/dashboard',
    },
  ];

  readonly tips = [
    { tint: 'yellow', title: "Describe, don't filter", body: 'Type what you need the way you would say it to a person in the store, including budget, occasion and size.' },
    { tint: 'green', title: 'Referrals are labeled', body: 'When a store suggests another store, it says so, and it says who you will check out with.' },
    { tint: 'violet', title: "Prices are the store's own", body: 'A referral never changes the price. The store you buy from sets it.' },
  ];

  constructor () {
    inject( SeoService ).set( {
      title: '16Ahead Store Help: From catalog to your first referral',
      description: 'Import your catalog, add your brand, review your store, get paid with Stripe, and control your referrals. Six steps, in the order most stores take them.',
      path: '/help',
    } );

    const isBrowser = isPlatformBrowser( inject( PLATFORM_ID ) );
    const destroyRef = inject( DestroyRef );
    afterNextRender( () => {
      if ( !isBrowser || typeof IntersectionObserver === 'undefined' ) return;
      // The step nearest the upper middle of the window is the active one.
      const observer = new IntersectionObserver( ( entries ) => {
        const visible = entries.filter( ( entry ) => entry.isIntersecting )
          .sort( ( a, b ) => a.boundingClientRect.top - b.boundingClientRect.top );
        if ( visible[0] ) this.active.set( Number( ( visible[0].target as HTMLElement ).dataset['index'] ) );
      }, { rootMargin: '-30% 0px -55% 0px' } );
      this.cards().forEach( ( card ) => observer.observe( card.nativeElement ) );
      destroyRef.onDestroy( () => observer.disconnect() );
    } );
  }

  select ( index: number ): void {
    this.active.set( index );
    this.cards()[index]?.nativeElement.scrollIntoView( { behavior: 'smooth', block: 'center' } );
  }
}
