# Design: Om Os

## Formål

Opret en selvstændig, SEO-optimeret side på `/om-os/`, der fortæller CarUpgrades historie personligt i jeg-form. Siden skal styrke tilliden til mekanikeren bag virksomheden og gøre det tydeligt, at CarUpgrade begyndte i København i 2023 og nu også reparerer biler fra en afdeling i Vamdrup, som dækker en større del af Jylland.

## Navigation

Hovednavigationen skal have linket **Om Os** placeret direkte mellem **Reparationer** og **FAQ**. Linket peger på `/om-os/` og tilføjes på forsiden, FAQ-siden og alle øvrige sider, der viser den samme hovednavigation.

På Om Os-siden markeres linket med `aria-current="page"`. Relevante footer-links til det eksisterende `#omOs`-afsnit ændres til `/om-os/` og får teksten **Om Os**.

## Indhold og tone

Teksten skrives i jeg-form og skal føles personlig, jordnær og fagligt troværdig. Den må ikke opfinde uddannelser, anciennitet, medarbejderantal, konkrete dækningsbyer eller andre fakta, som ikke er oplyst.

Fortællingen bygges op omkring:

1. CarUpgrade blev startet i København i 2023 af mekanikeren bag virksomheden.
2. Virksomheden udsprang af ønsket om ærlig rådgivning, ordentligt mekanikerarbejde og en enklere oplevelse for bilejeren.
3. CarUpgrade har siden åbnet en afdeling i Vamdrup.
4. Fra Vamdrup udføres bilreparationer for kunder i en større del af Jylland.
5. Faglig stolthed, praktisk erfaring og ansvar for det færdige arbejde er gennemgående værdier.

## Sideopbygning

### Hero

- H1: **Fra København til Jylland – CarUpgrade er vokset med opgaven**
- Undertekst: **Jeg startede CarUpgrade som mekaniker i København i 2023. I dag reparerer vi også biler fra vores afdeling i Vamdrup og dækker en større del af Jylland.**
- Heroen skal bruge et eksisterende, relevant billede fra CarUpgrades arbejde.

### Historien

Et sammenhængende, personligt afsnit beskriver starten, motivationen og udviklingen. Teksten skal prioritere en naturlig fortælling frem for at gentage SEO-søgeord.

### Tidslinje

En enkel visuel tidslinje med mindst disse to punkter:

- **København · 2023** — CarUpgrade bliver startet.
- **Vamdrup · i dag** — Ny afdeling med bilreparation i en større del af Jylland.

### Mekanikerfaget og værdierne

Et afsnit om personlig service, ærlig rådgivning og ordentligt håndværk. Afsnittet skrives fortsat i jeg-form.

### Kontakt

Siden afsluttes med én tydelig CTA, der sender brugeren til kontaktformularen på `/#kontakt`.

## Visuel retning

Siden skal ligne en naturlig del af den eksisterende hjemmeside:

- Samme mørke, industrielle farveunivers og røde accentfarve.
- Samme typografi: Barlow Condensed til overskrifter og DM Sans til brødtekst.
- Samme navigation, knapper, billedbehandling og footer.
- Et asymmetrisk layout, som matcher den eksisterende forside og FAQ-side.
- Eksisterende værkstedsbilleder genbruges; der tilføjes ikke generiske stockfotos.
- Mobilvisningen samler flerkolonnelayouts i én kolonne og bevarer læsbar rækkefølge.

## SEO

Siden skal have:

- Unik title og meta description.
- Canonical URL `https://carupgrade.dk/om-os/`.
- Open Graph- og Twitter-metadata.
- Strukturerede `AboutPage`-, `BreadcrumbList`- og relevante virksomhedsdata i JSON-LD.
- En H1 og semantiske H2-overskrifter.
- Naturlig brug af termerne **mekaniker i Jylland**, **bilreparation i Jylland**, **autoværksted i Vamdrup** og **CarUpgrade**, uden søgeordsfyld.
- En post i `sitemap.xml`.

## Test og acceptkriterier

- `/om-os/` eksisterer og kan åbnes som selvstændig side.
- Hovednavigationen viser rækkefølgen **Reparationer**, **Om Os**, **FAQ**.
- Om Os-linket findes på alle sider med den fælles hovednavigation.
- Siden indeholder den godkendte H1 og undertekst.
- Fortællingen er konsekvent skrevet i jeg-form.
- København, 2023, Vamdrup og dækning af en større del af Jylland fremgår faktuelt.
- Title, description, canonical, sociale metadata og JSON-LD er gyldige og entydige.
- `sitemap.xml` indeholder `/om-os/`.
- Eksisterende automatiske tests består, og nye integrationstests dækker siden og navigationsrækkefølgen.
- Siden fungerer ved relevante mobil- og desktopbredder uden vandret overflow eller navigation i flere linjer.
