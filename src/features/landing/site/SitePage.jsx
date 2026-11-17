/**
 * Public landing page for the ISCS HR portal.
 *
 * Composition only. Copy lives in ./copy.js, product screens in
 * ./HeroScreen.jsx and ./TourScreens.jsx. No API calls, no auth, no shared
 * state - it can be rendered by anyone, signed in or not.
 */
import { useEffect } from 'react';

import './site.css';
import { useDisplayFont } from './primitives';
import { InfraStrip, SiteHero, SiteNav } from './Top';
import { ProductTour } from './ProductTour';
import { ClosingCta, Details, Faq, Journey, Security, SiteFooter } from './Sections';

export function SitePage() {
  useDisplayFont();

  useEffect(() => {
    const previous = document.title;
    document.title = 'ISCS HR · From offer letter to payslip';
    return () => {
      document.title = previous;
    };
  }, []);

  return (
    <div id="top" className="min-h-screen bg-white text-slate-900 antialiased">
      <a
        href="#product"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:shadow-lg"
      >
        Skip to content
      </a>
      <SiteNav />
      <main>
        <SiteHero />
        <InfraStrip />
        <ProductTour />
        <Journey />
        <Details />
        <Security />
        <Faq />
        <ClosingCta />
      </main>
      <SiteFooter />
    </div>
  );
}
