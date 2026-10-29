import { MenuAppConfig } from '@taliferro/ui/platform/universal-menu.model';

/** TODD Market's part of the universal menu. */
export const PLATFORM_MENU_CONFIG: MenuAppConfig = {
  app: 'market',
  name: '16Ahead Store',
  items: [
    { label: 'Home', icon: 'home', route: '/' },
    { label: 'My store', icon: 'grid', route: '/app', keywords: 'dashboard referrals onboarding merchant' },
    { label: 'My orders', icon: 'list', route: '/account', keywords: 'orders returns shopper account' },
  ],
  secondaryItems: [
    { label: 'Pricing', icon: 'card', route: '/pricing', keywords: 'price fee cost' },
    { label: 'Help', icon: 'help', route: '/help' },
    { label: 'About', icon: 'info', route: '/about' },
    { label: 'iOS App', icon: 'phone', route: '/ios', keywords: 'iphone app store' },
  ],
  signInRoute: '/sign-in',
};
