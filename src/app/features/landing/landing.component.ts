import { ChangeDetectionStrategy, Component, ElementRef, inject, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';

import { SeoService } from '../../services/seo.service';
import { IconComponent } from '../../shared/icon/icon.component';
import { PublicHeaderComponent } from '../../shared/public-header/public-header.component';
import { SiteFooterComponent } from '../../shared/site-footer/site-footer.component';
import { HowItWorksVideoComponent } from '../../shared/video-player/how-it-works-video.component';
import { SAMPLE_STORE_PATH } from '../../models/market.constants';

type Tint = 'blue' | 'cyan' | 'pink' | 'violet' | 'yellow' | 'green';

/** The signed-out home (handoff Part 2, Landing: e01–e03, m10). Prerendered. */
@Component( {
  selector: 'tm-landing',
  standalone: true,
  imports: [RouterLink, IconComponent, PublicHeaderComponent, SiteFooterComponent, HowItWorksVideoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'tt-page' },
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css',
} )
export class LandingComponent {
  private readonly videoSection = viewChild.required<ElementRef<HTMLElement>>( 'videoSection' );
  private readonly video = viewChild.required( HowItWorksVideoComponent );
  readonly sampleStore = SAMPLE_STORE_PATH;

  readonly principles: { tag: string; tint: Tint; title: string; body: string }[] = [
    { tag: 'Intent over browsing', tint: 'blue', title: 'Shoppers describe it', body: 'Shoppers say what they need in plain words. The store narrows it down, puts outfits and bundles together, and explains the trade-offs.' },
    { tag: 'No dead ends', tint: 'pink', title: 'Every search goes somewhere', body: "If you don't carry it, a trusted store in the network does. The handoff reads like a recommendation, not an ad." },
    { tag: 'Almost no setup', tint: 'green', title: 'Import, approve, open', body: 'The AI builds the store from your catalog. The one step that takes real time is payment verification, which the law requires.' },
    { tag: 'Agent-readable', tint: 'violet', title: 'Ready for AI shoppers', body: 'Every product, price, stock level and policy is clean, structured data that AI shopping agents can read and buy from.' },
  ];

  readonly steps: { n: string; tint: Tint; title: string; body: string }[] = [
    { n: '01', tint: 'blue', title: 'Import your catalog', body: 'Shopify, Salesforce Commerce, a CSV file, or photos and price sheets.' },
    { n: '02', tint: 'cyan', title: 'Approve your store', body: 'Add your logo and colors, check what the AI built, and change anything you like.' },
    { n: '03', tint: 'green', title: 'Get paid and join the network', body: 'Connect Stripe to take orders. Nearby stores can start sending you shoppers.' },
  ];

  constructor () {
    inject( SeoService ).set( {
      title: '16Ahead Store: Independent stores that send each other customers',
      description: "Bring your catalog and 16Ahead Store builds your store. Shoppers say what they need in plain words. When you don't carry it, we send them to a store that does, and you earn part of that sale.",
      path: '/sell',
    } );
  }

  /** "▶ Watch how it works": scroll to the video and start it. */
  watch (): void {
    this.videoSection().nativeElement.scrollIntoView( { behavior: 'smooth', block: 'center' } );
    this.video().play();
  }
}
