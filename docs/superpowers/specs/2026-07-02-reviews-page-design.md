# Anmeldelsesside og opdateret Trustpilot-design

## Formål

CarUpgrades anmeldelser flyttes fra forsiden til en selvstændig side på `/anmeldelser/`. Den nye side skal bevare hjemmesidens eksisterende visuelle identitet, vise de fire aktuelle Trustpilot-anmeldelser og afsluttes med en stærk CTA samt den eksisterende kontaktformular.

## Omfang

- Opret en offentlig, indekserbar side på `/anmeldelser/`.
- Fjern hele anmeldelsessektionen fra forsiden.
- Opdater alle synlige Trustpilot-tal til TrustScore `4,0` baseret på `4 anmeldelser`.
- Opdater hovednavigation og relevante footer-links på alle sider til `/anmeldelser/`.
- Placer `Anmeldelser` mellem `Reparationer` og `Om Os` i hovednavigationen.
- Tilføj anmeldelsessiden til sitemap.
- Bevar forsidens eksisterende kontaktsektion uændret.

## Sidearkitektur

Den nye side genbruger forsidens designgrundlag: navigation, logo, farvevariabler, Barlow Condensed og DM Sans, knapper, spacing, mørke flader, røde accenter og footer.

Siden bygges i denne rækkefølge:

1. Fast hovednavigation med `Anmeldelser` markeret som aktiv side.
2. Kompakt hero med overskrift, kort introduktion, TrustScore `4,0`, femstjernet visning og teksten `4 anmeldelser`.
3. En anmeldelsessektion med fire ensartede kort.
4. En tydelig ekstern knap til CarUpgrades officielle Trustpilot-profil.
5. En stærk rød CTA, der leder visuelt og indholdsmæssigt videre til kontaktformularen.
6. Den eksisterende kontaktsektion med kontaktoplysninger og formular.
7. Den fælles footer.

På desktop vises anmeldelseskortene i et afbalanceret grid. På mobil stables de i én kolonne. Fokus-, hover- og reveal-adfærd følger de eksisterende mønstre.

## Anmeldelsesindhold

Siden viser følgende fire femstjernede anmeldelser fra den Trustpilot-profil og de skærmbilleder, brugeren har leveret:

1. **Intl** — oplevelsesdato 30. juni 2026  
   Titel: `Super tilfreds!`  
   Tekst: `Hurtig, professionel og en meget behagelig service. Jeg bruger Carupgrade næste gang også. Fem stjerner herfra!`
2. **Sofie Jensen** — oplevelsesdato 6. maj 2026  
   Titel: `Har brugt ham flere gange og er altid...`  
   Tekst: `Har brugt ham flere gange og er altid tilfreds 👍 Hurtig og professionel service.`
3. **Leif vester** — 23. november 2025  
   Titel: `Vild god service`  
   Tekst: `Vild god service. Har brugt ham flere gange, har lige fået skiftet bremser til en god pris. Altid godt humør.`
4. **Søren** — 14. december 2024  
   Titel: `God og hurtig reparation`  
   Tekst: `God og hurtig reparation. Jeg fik pris på service bagefter, som jeg også sagde ja til.`

Kortene identificerer Trustpilot som kilde og linker ikke den enkelte anmeldelse til en intern, opdigtet URL. Den officielle profilknap åbner `https://dk.trustpilot.com/review/carupgrade.dk` i en ny fane med sikker `rel`-værdi.

## Forside og global navigation

Forsiden må ikke længere indeholde `<section id="anmeldelser">` eller anmeldelseskort. Trustpilot må fortsat bruges som social proof i hero- og kvalitetssektionerne, men værdierne ændres fra `3.8`/`3,8` og `2 anmeldelser` til `4.0`/`4,0` og `4 anmeldelser`, afhængigt af den eksisterende danske eller kompakte præsentation.

Hovednavigationens relevante rækkefølge bliver:

`Reparationer` → `Anmeldelser` → `Om Os` → `FAQ` → `Kontakt`

På forsiden og øvrige sider linker `Anmeldelser` til `/anmeldelser/`. Footer-links, der tidligere pegede på `/#anmeldelser`, opdateres tilsvarende. Direkte links til Trustpilot bevares, hvor linkteksten udtrykkeligt handler om Trustpilot.

## CTA og kontaktformular

Nederst på anmeldelsessiden indsættes en stærk CTA i hjemmesidens eksisterende røde og mørke design. Budskabet kobler kundernes erfaringer til næste handling: at få et uforpligtende tilbud.

Kontaktsektionen genbruger felterne og informationshierarkiet fra forsiden:

- Navn (påkrævet)
- Telefon
- Email (påkrævet)
- Nummerplade
- Servicetype
- Beskrivelse af opgaven (påkrævet)
- Honeypot
- Cloudflare Turnstile
- Submit-knap og statusområde

Formularen sender fortsat til `/api/contact`. Den eksisterende backend, rate limiting, same-origin-kontrol, Turnstile-verifikation og Resend-mailflow ændres ikke.

Klientscriptet på anmeldelsessiden genbruger den eksisterende validerings-, Turnstile- og submit-adfærd. Fejl vises i statusområdet, og brugeren får fortsat de eksisterende alternative kontaktoplysninger ved tekniske problemer.

## Metadata og strukturerede data

`/anmeldelser/` får:

- Dansk title og meta description.
- Canonical `https://carupgrade.dk/anmeldelser/`.
- Open Graph- og Twitter-metadata i samme mønster som resten af sitet.
- Organization- og WebSite-referencer med de eksisterende stabile identiteter.
- En WebPage-entitet for anmeldelsessiden.

Der tilføjes ikke selvrapporteret AggregateRating eller Review-schema, da anmeldelserne stammer fra en tredjepartsplatform, og siden ikke skal skabe misvisende rich-result markup.

## Test og verifikation

Automatiske integrationstests skal kontrollere:

- At den nye side findes og indgår i det forventede antal HTML-sider.
- At canonical, metadata og sitemap-URL er korrekte.
- At siden indeholder fire anmeldelseskort og de fire godkendte anmeldere/tekster.
- At TrustScore `4,0` og `4 anmeldelser` vises på anmeldelsessiden.
- At den gamle anmeldelsessektion ikke findes på forsiden.
- At forsiden ikke længere indeholder forældede Trustpilot-tal.
- At `Anmeldelser` står mellem `Reparationer` og `Om Os` i relevante hovednavigationer.
- At interne anmeldelseslinks peger på `/anmeldelser/`.
- At kontaktformularen på anmeldelsessiden sender til `/api/contact` og indeholder Turnstile, honeypot samt de påkrævede felter.

Efter de automatiske tests verificeres desktop- og mobilvisning i browseren. Der kontrolleres især navigation, kortgrid, CTA, formularlayout, fokusmarkeringer, submit-status og fravær af konsolfejl.

## Ikke omfattet

- Automatisk synkronisering med Trustpilot.
- Trustpilot-widget eller nyt cookie-samtykke til tredjepartsindhold.
- Ændringer i kontakt-API'et eller mailmodtagere.
- Redesign af forsiden, øvrige undersider eller footerens generelle informationsarkitektur.
