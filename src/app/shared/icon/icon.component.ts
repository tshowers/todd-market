import { isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, PLATFORM_ID, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

/** The Lucide icons Market uses (README "Assets": Lucide style, inline SVG). */
const PATHS: Record<string, string> = {
  search: '<circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/>',
  'shopping-bag': '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/><path d="M3 6h18"/><path d="M16 10a4 4 0 0 1-8 0"/>',
  store: '<path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12a2 2 0 0 1-2-2V7"/>',
  user: '<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
  play: '<path d="M8 5.5v13l11-6.5z" fill="currentColor" stroke="none"/>',
  'arrow-left': '<path d="m12 19-7-7 7-7"/><path d="M19 12H5"/>',
  'arrow-right': '<path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>',
  x: '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  minus: '<path d="M5 12h14"/>',
  upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/>',
  truck: '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.62l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
  apple: '<path d="M16.37 12.6c-.02-2.26 1.85-3.35 1.93-3.4-1.05-1.54-2.69-1.75-3.27-1.77-1.39-.14-2.72.82-3.42.82-.71 0-1.8-.8-2.96-.78-1.52.02-2.92.89-3.7 2.25-1.58 2.74-.4 6.8 1.13 9.02.75 1.09 1.64 2.3 2.81 2.26 1.13-.05 1.55-.73 2.92-.73 1.36 0 1.75.73 2.94.71 1.22-.02 1.99-1.1 2.73-2.2.86-1.26 1.21-2.48 1.23-2.54-.03-.01-2.36-.9-2.38-3.58ZM14.12 5.95c.62-.76 1.04-1.8.93-2.85-.9.04-1.99.6-2.63 1.35-.57.66-1.08 1.73-.94 2.75 1 .08 2.02-.51 2.64-1.25Z" fill="currentColor" stroke="none"/>',
};

@Component( {
  selector: 'tm-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  // The server DOM used for prerendering can't set innerHTML on SVG, so the
  // paths are drawn in the browser only; prerendered pages get an empty box
  // of the same size.
  template: `@if (isBrowser) {
    <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" [innerHTML]="markup()"></svg>
  } @else {
    <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 24 24" aria-hidden="true"></svg>
  }`,
  styles: [':host { display: inline-flex; flex: none; line-height: 0; }'],
} )
export class IconComponent {
  readonly name = input.required<string>();
  readonly size = input( 20 );
  readonly isBrowser = isPlatformBrowser( inject( PLATFORM_ID ) );
  private readonly sanitizer = inject( DomSanitizer );
  // Static, trusted strings from PATHS only - never user input. Angular's
  // sanitizer would otherwise strip the SVG children.
  readonly markup = computed( () => this.sanitizer.bypassSecurityTrustHtml( PATHS[this.name()] ?? '' ) );
}
