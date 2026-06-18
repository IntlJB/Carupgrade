# SEO legacy cleanup notes

Date: 2026-06-18

## Current public focus

The current sitemap and canonical tags focus on:

- `https://carupgrade.dk/`
- `https://carupgrade.dk/mobil-mekaniker/`
- `https://carupgrade.dk/mobilt-vaerksted/`
- `https://carupgrade.dk/bilservice-hjemme/`
- `https://carupgrade.dk/autovaerksted-vaerloese/`
- Supporting service and policy pages already listed in `sitemap.xml`.

## Handled in `vercel.json`

- `www.carupgrade.dk/:path*` -> `https://carupgrade.dk/:path*`
- Old sitemap variants (`/sitemap_index.xml`, `/local-sitemap.xml`, `/page-sitemap.xml`, `/product-sitemap.xml`) -> `/sitemap.xml`
- Targeted infotainment redirects:
  - `/product/:slug` containing `carplay`, `android-auto`, `androidauto`, `oemupgrade`, `infotainment`, `toyota-chr`, `toyota-c-hr`, or `volkswagen` -> `/biludstyr-og-infotainment/`
  - `/product-category/:slug` containing `carplay`, `android-auto`, `androidauto`, `oemupgrade`, `infotainment`, `toyota-chr`, `toyota-c-hr`, or `volkswagen` -> `/biludstyr-og-infotainment/`
- Existing legacy shop catch-alls:
  - `/product/(.*)` -> `/#kontakt`
  - `/product-category/(.*)` -> `/#services`

## Manual decision required

The repo now contains a neutral information page for CarPlay, Android Auto, OEMUpgrade, Toyota C-HR CarPlay, Volkswagen Android Auto, and infotainment-related searches:

- `https://carupgrade.dk/biludstyr-og-infotainment/`

Carupgrade does not market OEMUpgrade as a fixed main service. The page is intended for neutral assessment, troubleshooting, and guidance only.

Do not add more aggressive redirects until Search Console / analytics data confirms the exact old URLs and their intent.

Still requiring manual decision:

- Old `/product/...` URLs that do not clearly contain CarPlay, Android Auto, OEMUpgrade, infotainment, Toyota C-HR, or Volkswagen intent.
- Old `/product-category/...` URLs that do not clearly contain CarPlay, Android Auto, OEMUpgrade, infotainment, Toyota C-HR, or Volkswagen intent.
- Any old product URL whose slug describes hardware, parts, accessories, checkout, cart, or another service without a clear infotainment relation.
- Whether individual high-value product URLs should redirect to a more specific future evergreen page if analytics later supports creating one.

Known legacy URL patterns/queries to review:

- `/product/...`
- `/product-category/...`
- `oemupgrade`
- `toyota chr apple carplay`
- `android auto volkswagen`
- old `www.carupgrade.dk/product/...` URLs
