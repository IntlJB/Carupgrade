# Lokal SEO for Vamdrup og Jylland

**Dato:** 1. juli 2026  
**Status:** Godkendt design

## Formål

CarUpgrade skal opbygge organisk synlighed for mobil mekaniker i Jylland med udgangspunkt i den nye fysiske afdeling på Gåskærvej 12, 6580 Vamdrup. Den mobile service er det primære tilbud. Afdelingen kan samtidig modtage biler og udføre komplekse opgaver på værkstedet.

Løsningen skal skabe relevante lokale landingssider uden at producere ensartede bysider, der kan opfattes som doorway pages. Siderne må gerne være udeladt fra hovedmenuen, men de skal være synlige for brugere gennem relevante interne links og må ikke være teknisk eller strukturelt skjulte.

## Forretningsoplysninger

### Vamdrup-afdelingen

- Adresse: Gåskærvej 12, 6580 Vamdrup
- Telefon: +45 31 14 77 37
- Åbningstider: mandag-lørdag 09:00-19:00; søndag lukket
- Kundeadgang: kunder kan møde personale på adressen i åbningstiden
- Primær ydelse: udekørende mekaniker
- Sekundær ydelse: værkstedsarbejde på komplekse opgaver
- Dækningsområde: cirka 100 km fra Vamdrup, når opgaven og køretiden gør det praktisk
- Google Business Profile: selvstændig profil for den fysiske Vamdrup-afdeling

Værløse og Vamdrup er to reelle lokationer og skal repræsenteres separat i både indhold, strukturerede data og Google Business Profile.

## Informationsarkitektur

Første udgivelse omfatter otte nye sider:

1. `/mobil-mekaniker-vamdrup/`
2. `/mobil-mekaniker-jylland/`
3. `/mobil-mekaniker-kolding/`
4. `/mobil-mekaniker-haderslev/`
5. `/mobil-mekaniker-vejen/`
6. `/mobil-mekaniker-fredericia/`
7. `/mobil-mekaniker-vejle/`
8. `/mobil-mekaniker-esbjerg/`

Vamdrup-siden er lokations- og konverteringsside for den fysiske afdeling. Jylland-siden er regional hub. De seks øvrige sider er lokale servicesider med Vamdrup-afdelingen som leverandør.

Byerne er valgt for at kombinere kort afstand til Vamdrup, befolkningsgrundlag, regional relevans og realistisk mobil dækning. Yderligere bysider oprettes først, når Search Console, Google Business Profile og kontaktdata viser konkret efterspørgsel.

## Søgeintention og sideansvar

### Vamdrup

- Primær intention: `mobil mekaniker Vamdrup`
- Sekundære intentioner: `autoværksted Vamdrup`, `bilservice Vamdrup`
- Skal forklare både mobil service og muligheden for værkstedsarbejde
- Skal vise fuld adresse, telefon, åbningstider, kort/vejvisning og kontaktmuligheder

### Jylland

- Primære intentioner: `mobil mekaniker Jylland`, `mobilt værksted Jylland`
- Skal forklare dækningsmodellen og fungere som oversigt over betjente byer
- Skal linke til Vamdrup og alle seks bysider

### Bysider

- Primær intention følger mønstret `mobil mekaniker [by]`
- Relaterede ydelser omtales på samme side, når de er relevante
- Der oprettes ikke separate kombinationssider for hver ydelse og by i første fase

## Indholdskrav

Alle sider skal være skrevet til den konkrete søgeintention og kunne give værdi uden at brugeren besøger en anden lokal side. En byside må ikke fremstilles ved blot at erstatte bynavnet i en skabelontekst.

Hver byside skal indeholde:

- en unik title, meta description og H1
- en konkret forklaring af mobil service i byen
- realistisk køretid eller afstand fra Vamdrup, verificeret før publicering
- hvilke opgaver der typisk kan udføres hos kunden
- hvornår bilen i stedet tages til værkstedet i Vamdrup
- relevante lokale områder eller postnumre, som reelt dækkes
- en unik FAQ baseret på lokale forhold og kundernes beslutningsbehov
- telefon- og kontakt-CTA med tydelig henvisning til Vamdrup-afdelingen
- mindst ét relevant billede med beskrivende alt-tekst; lokale billeder erstatter generiske billeder, når de bliver tilgængelige
- links til relevante ydelsessider og til Jylland-hubben

Lokale kundeeksempler, anmeldelser og fotos tilføjes kun, når de er autentiske og kan knyttes til den pågældende afdeling eller det relevante område. Der må ikke konstrueres lokal dokumentation alene for SEO.

## Intern linking og synlighed

Siderne placeres ikke nødvendigvis i hovedmenuen. De skal dog kunne findes gennem almindelig navigation:

- Jylland-hubben indeholder en synlig sektion med alle dækkede byer
- Vamdrup-siden linker til Jylland-hubben og de lokale bysider
- relevante generelle ydelsessider linker kontekstuelt til Jylland- og Vamdrup-siderne
- bysider linker tilbage til Jylland-hubben og Vamdrup-afdelingen
- breadcrumbs viser sidehierarkiet visuelt og i strukturerede data
- en diskret synlig footer- eller områdesektion kan linke til Jylland-hubben, men ikke erstatte kontekstuelle links

Alle sider skal være `index, follow`, have self-referencing canonical og være med i sitemap. Der må ikke oprettes orphan pages, skjult tekst eller links, som kun er tilgængelige for crawlere.

## Strukturerede data

Den nuværende model, hvor Værløse-adressen anvendes som et fælles `#business`, skal opdeles.

Den fremtidige model består af:

- én overordnet `Organization` for CarUpgrade
- én unik `AutoRepair`/`LocalBusiness` for Værløse
- én unik `AutoRepair`/`LocalBusiness` for Vamdrup
- entydige, stabile `@id`-værdier for organisationen og hver lokation
- en relation fra begge lokationer til den overordnede organisation

Vamdrup-lokationen skal indeholde den fulde adresse, telefon, åbningstider, URL og geografiske koordinater. Koordinater verificeres mod den endelige Google Business Profile eller en autoritativ kortkilde før publicering.

Jylland- og bysiderne bruger `WebPage`, `Service` og `BreadcrumbList`, hvor den leverende virksomhed peger på Vamdrup-lokationens `@id`. Kun Vamdrup-siden og andre sider, der reelt beskriver afdelingen, må fremstille Gåskærvej 12 som fysisk lokation. Bysiderne må ikke angive falske lokale adresser.

FAQ-markup må kun afspejle FAQ-indhold, som også er synligt på den pågældende side. Strukturerede data skal valideres med Googles Rich Results Test før udgivelse.

## Google Business Profile

Vamdrup oprettes som en fysisk, bemandet hybridlokation med både adresse og serviceområder. Følgende skal være identisk mellem profil, landingsside og strukturerede data:

- virksomhedsnavn
- adresse
- telefonnummer
- åbningstider
- primær kategori og faktiske ydelser

Profilens website-link skal pege direkte på:

`https://carupgrade.dk/mobil-mekaniker-vamdrup/?utm_source=google&utm_medium=organic&utm_campaign=gbp_vamdrup`

Sidens canonical forbliver URL'en uden UTM-parametre. Profilen skal bruge autentiske billeder af adressen, skiltning, værksted og udekørende service. Servicelisten skal afspejle det arbejde, afdelingen faktisk udfører.

## Metadata og tekniske krav

Hver ny side skal have:

- unik title og meta description
- self-referencing canonical på sidens egen absolutte URL under `https://carupgrade.dk/`
- `lang="da"` og korrekt dansk indhold
- Open Graph- og Twitter-metadata
- entydig H1 og logisk H2/H3-struktur
- mobilvenligt layout og eksisterende cookie-/analyseintegration
- optimerede billeder med eksplicitte dimensioner og passende formater
- fungerende kontaktformular og telefonlinks
- HTTP 200 og ingen omdirigeringskæder

Sitemap opdateres med de nye canonical-URL'er og deres faktiske ændringsdato. `priority` og `changefreq` kan fjernes, fordi Google ikke bruger disse sitemapfelter. `robots.txt` skal fortsat tillade crawling og referere til sitemap.

## Måling og beslutningsregler

GA4 og Search Console anvendes til at måle:

- organiske visninger og klik pr. landingsside
- søgefraser og geografisk relevans
- klik på telefonnummer
- indsendte kontaktformularer
- klik fra Google Business Profile via UTM-kampagnen

Der registreres en baseline ved udgivelsen. Første indholdsevaluering gennemføres efter 8-12 uger. Indhold kan forbedres tidligere ved tekniske fejl eller tydelige misforståelser, men der oprettes ikke flere bysider alene på baggrund af manglende placeringer i de første uger.

Nye byer prioriteres, når mindst ét af følgende gælder:

- Search Console viser relevant efterspørgsel fra et område uden en dedikeret side
- Google Business Profile viser gentagne handlinger eller ruteforespørgsler fra området
- faktiske leads eller kunder dokumenterer kommerciel efterspørgsel
- der findes tilstrækkeligt unikt lokalt indhold til en selvstændig side

## Test og kvalitetssikring

Før udgivelse verificeres:

- alle nye URL'er returnerer HTTP 200
- canonical, title, description og H1 er korrekte og unikke
- interne links og breadcrumbs virker begge veje
- sitemap indeholder hver canonical præcis én gang
- Værløse- og Vamdrup-schema har separate identiteter og korrekte adresser
- bysider peger på Vamdrup som leverandør uden at hævde en lokal filial
- åbningstider og telefon er ens på side, schema og Google Business Profile
- JSON-LD kan parses og består Rich Results Test uden kritiske fejl
- formular, telefonlinks, cookie-samtykke og analyseevents fungerer på mobil og desktop
- eksisterende HTML-integrationstests udvides til at dække de nye sider og lokationsadskillelsen

## Uden for første fase

- service-by-kombinationer ud over den ene primære byside
- sider for yderligere byer inden for 100 km
- automatisk genererede lokale sider
- kunstige anmeldelser, lokale cases eller adresser
- ændringer af Google Business Profile for Værløse ud over nødvendig konsistens med den nye lokationsmodel

## Retningslinjer

Designet følger Googles retningslinjer for [doorway abuse](https://developers.google.com/search/docs/essentials/spam-policies), [LocalBusiness-strukturerede data](https://developers.google.com/search/docs/appearance/structured-data/local-business) og [hybridvirksomheder i Google Business Profile](https://support.google.com/business/answer/3038177?hl=en).
