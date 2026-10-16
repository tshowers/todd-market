import { Routes } from '@angular/router';

import { signedInGuard } from './services/auth.guard';

export const routes: Routes = [
  // Shoppers: "/" is Search all stores, toggled with the Store directory
  // (or, on a store's own domain, that store). Merchants: /sell.
  { path: '', pathMatch: 'full', loadComponent: () => import( './features/root/root.component' ).then( ( m ) => m.RootComponent ) },
  { path: 'stores', data: { view: 'stores' }, loadComponent: () => import( './features/shop/shop.component' ).then( ( m ) => m.ShopComponent ) },
  { path: 'search', loadComponent: () => import( './features/shop/shop.component' ).then( ( m ) => m.ShopComponent ) },
  { path: 'sell', loadComponent: () => import( './features/landing/landing.component' ).then( ( m ) => m.LandingComponent ) },
  { path: 'about', loadComponent: () => import( './features/about/about.component' ).then( ( m ) => m.AboutComponent ) },
  { path: 'help', loadComponent: () => import( './features/help/help.component' ).then( ( m ) => m.HelpComponent ) },
  { path: 'pricing', loadComponent: () => import( './features/pricing/pricing.component' ).then( ( m ) => m.PricingComponent ) },
  { path: 'ios', loadComponent: () => import( './features/ios/ios.component' ).then( ( m ) => m.IosComponent ) },
  { path: 'sign-in', loadComponent: () => import( './features/sign-in/sign-in.component' ).then( ( m ) => m.SignInComponent ) },
  {
    path: 'sign-in/verify',
    data: { verify: true },
    loadComponent: () => import( './features/sign-in/sign-in.component' ).then( ( m ) => m.SignInComponent ),
  },
  {
    path: 'app',
    canActivate: [signedInGuard],
    loadComponent: () => import( './features/merchant/merchant-shell.component' ).then( ( m ) => m.MerchantShellComponent ),
    children: [
      { path: '', pathMatch: 'full', loadComponent: () => import( './features/merchant/merchant-home.component' ).then( ( m ) => m.MerchantHomeComponent ) },
      { path: 'onboarding', pathMatch: 'full', redirectTo: '' },
      { path: 'onboarding/import', title: 'Import | TODD Market', loadComponent: () => import( './features/merchant/onboarding/import.component' ).then( ( m ) => m.ImportComponent ) },
      { path: 'onboarding/brand', title: 'Brand | TODD Market', loadComponent: () => import( './features/merchant/onboarding/brand.component' ).then( ( m ) => m.BrandComponent ) },
      { path: 'onboarding/build', title: 'Building | TODD Market', loadComponent: () => import( './features/merchant/onboarding/build.component' ).then( ( m ) => m.BuildComponent ) },
      { path: 'onboarding/get-paid', title: 'Get paid | TODD Market', loadComponent: () => import( './features/merchant/onboarding/get-paid.component' ).then( ( m ) => m.GetPaidComponent ) },
      { path: 'onboarding/live', title: 'Live | TODD Market', loadComponent: () => import( './features/merchant/onboarding/live.component' ).then( ( m ) => m.LiveComponent ) },
      { path: 'orders', title: 'Orders | TODD Market', loadComponent: () => import( './features/merchant/orders/orders.component' ).then( ( m ) => m.OrdersComponent ) },
      { path: 'dashboard', title: 'Referrals | TODD Market', loadComponent: () => import( './features/merchant/dashboard/dashboard.component' ).then( ( m ) => m.DashboardComponent ) },
      { path: 'settings', pathMatch: 'full', redirectTo: 'settings/store' },
      { path: 'settings/:tab', title: 'Settings | TODD Market', loadComponent: () => import( './features/merchant/settings/settings.component' ).then( ( m ) => m.SettingsComponent ) },
      { path: 'onboarding/review', title: 'Review | TODD Market', loadComponent: () => import( './features/merchant/onboarding/review.component' ).then( ( m ) => m.ReviewComponent ) },
    ],
  },
  {
    path: 'account',
    canActivate: [signedInGuard],
    loadComponent: () => import( './features/account/account-shell.component' ).then( ( m ) => m.AccountShellComponent ),
    children: [
      { path: '', pathMatch: 'full', title: 'Orders | TODD Market', loadComponent: () => import( './features/account/orders-list.component' ).then( ( m ) => m.OrdersListComponent ) },
      { path: 'orders/:id', title: 'Order | TODD Market', loadComponent: () => import( './features/account/order-detail.component' ).then( ( m ) => m.OrderDetailComponent ) },
      { path: 'orders/:id/return', title: 'Return an item | TODD Market', loadComponent: () => import( './features/account/return-flow.component' ).then( ( m ) => m.ReturnFlowComponent ) },
      ...( ['saved', 'addresses', 'payment-methods', 'security'] as const ).map( ( section ) => ( {
        path: section, data: { section }, title: 'Account | TODD Market',
        loadComponent: () => import( './features/account/account-sections.component' ).then( ( m ) => m.AccountSectionsComponent ),
      } ) ),
    ],
  },
  { path: 'order/:id', loadComponent: () => import( './features/checkout/order-confirmation.component' ).then( ( m ) => m.OrderConfirmationComponent ) },
  // Old store links (/s/<slug>) keep working.
  { path: 's/:slug/checkout', redirectTo: ':slug/checkout' },
  { path: 's/:slug', redirectTo: ':slug' },
  // Stores live at /<slug>; every named path above is reserved (RESERVED_SLUGS in the backend).
  { path: ':slug/checkout', loadComponent: () => import( './features/checkout/checkout.component' ).then( ( m ) => m.CheckoutComponent ) },
  { path: ':slug', loadComponent: () => import( './features/storefront/store.component' ).then( ( m ) => m.StoreComponent ) },
  { path: '**', loadComponent: () => import( './features/not-found/not-found.component' ).then( ( m ) => m.NotFoundComponent ) },
];
