import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    // Full app name shown in OS launchers, home screen, etc.
    name: 'StockMa',

    // Shorter name used when space is limited (keep under 12 chars)
    short_name: 'StockMa',

    // Shown in app store listings and install dialogs
    description: 'A stock manager app build using NextJS',

    // Unique identifier for this PWA — prevents issues if start_url ever changes
    id: '/stockma',

    // URL opened when user launches the app from their home screen / dock
    start_url: '/',

    // Limits which URLs are considered "inside" the app window.
    // Navigation outside this scope opens an in-app browser instead.
    scope: '/',

    // Primary language of the app (used by browsers and assistive tech)
    lang: 'en',

    // Preferred text direction for manifest fields like name/description
    // 'ltr' = left-to-right, 'rtl' = right-to-left, 'auto' = detect
    dir: 'ltr',

    // How much browser UI is shown: 'standalone' hides the address bar (most app-like)
    // Other options: 'fullscreen' | 'minimal-ui' | 'browser'
    display: 'standalone',

    // Preferred screen orientation when the app is launched
    // Options: 'portrait' | 'landscape' | 'any' | 'natural' | etc.
    orientation: 'portrait',

    // Background color shown on the splash screen before CSS loads
    background_color: '#ffffff',

    // Color applied to the browser toolbar / status bar / title bar
    theme_color: '#000000',

    // App store category hints — helps with discoverability
    // Full list: https://github.com/nickvdyck/webbundle/blob/main/src/manifest/categories.ts
    categories: ['business', 'productivity'],

    icons: [
      {
        src: '/web-app-manifest-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        // 'maskable' allows Android to reshape the icon (circle, squircle, etc.)
        // without adding an ugly white background
        purpose: 'maskable',
      },
      {
        src: '/web-app-manifest-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        // 'any' purpose = used as-is without masking (good for desktop / iOS)
        src: '/web-app-manifest-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],

    // App shortcuts — shown on long-press / right-click of the app icon
    // Great for jumping directly to key pages without opening the home screen first
    // shortcuts: [
    //   {
    //     name: 'New Order',
    //     short_name: 'Order',
    //     description: 'Create a new order',
    //     url: '/menu/order',
    //     icons: [{ src: '/web-app-manifest-192x192.png', sizes: '192x192' }],
    //   },
    //   {
    //     name: 'Inventory',
    //     short_name: 'Inventory',
    //     description: 'View inventory',
    //     url: '/menu/inventory',
    //     icons: [{ src: '/web-app-manifest-192x192.png', sizes: '192x192' }],
    //   },
    // ],

    // Screenshots shown in the Android rich install dialog (app-store style UI)
    // Requires at least one screenshot + description to trigger the richer UI
    // screenshots: [
    //   {
    //     src: '/screenshots/dashboard.png',
    //     sizes: '390x844',
    //     type: 'image/png',
    //     // 'narrow' = mobile, 'wide' = desktop/tablet
    //     // form_factor: 'narrow',
    //   },
    // ],

    // share_target: lets other apps share data INTO this app (like a native share sheet target)
    // share_target: {
    //   action: '/menu/order',
    //   method: 'GET',
    //   params: { title: 'title', text: 'text', url: 'url' },
    // },

    // file_handlers: register this app to open specific file types (e.g. CSV imports)
    // file_handlers: [
    //   {
    //     action: '/import',
    //     accept: { 'text/csv': ['.csv'] },
    //   },
    // ],

    // related_applications: link to a native app on an app store
    // prefer_related_applications: false, // set true to nudge users toward the native app instead
    // related_applications: [
    //   {
    //     platform: 'play',
    //     url: 'https://play.google.com/store/apps/details?id=com.example.stockma',
    //     id: 'com.example.stockma',
    //   },
    // ],
  };
}
