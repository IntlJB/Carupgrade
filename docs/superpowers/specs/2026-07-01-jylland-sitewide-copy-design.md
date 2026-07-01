# Jylland i generelle hjemmesidetekster

## Formål

CarUpgrades generelle hjemmesidetekster skal tydeligt angive, at virksomheden betjener både Sjælland og Jylland. Lokationsspecifikke sider og formuleringer skal fortsat beskrive deres faktiske lokale dækningsområde præcist.

## Omfang

- Den fælles footertekst ændres til: “Professionelt mobilt værksted der kommer til dig på Sjælland og i Jylland. Uddannede mekanikere, gennemsigtige priser og garanti på alt arbejde.”
- Generelle service-, FAQ- og SEO-tekster, der beskriver CarUpgrades samlede tilbud eller dækningsområde, opdateres til at omtale både Sjælland og Jylland.
- Synlig tekst, metadata, social metadata og strukturerede data holdes indbyrdes konsistente, når de beskriver samme generelle side.
- Formuleringen bruger grammatisk korrekt lille “i”: “på Sjælland og i Jylland”.

## Afgrænsning

- Sjælland-specifikke landingssider beholder deres fokus på Sjælland.
- Jylland-, Vamdrup- og byspecifikke landingssider beholder deres lokale fokus.
- Lokale virksomhedsoplysninger og `areaServed` ændres kun, hvis den pågældende side reelt beskriver det samlede dækningsområde.
- Der foretages ingen generel masseerstatning af ordet “Sjælland”.
- Design, navigation og funktionalitet ændres ikke.

## Implementering

Forekomster gennemgås enkeltvis og klassificeres som enten generelle eller lokationsspecifikke. Kun generelle forekomster opdateres. Eksisterende HTML-struktur og skrivestil bevares.

## Verifikation

- Søgning efter den gamle footertekst må ikke finde rester på sider med den fælles footer.
- Generelle sider må ikke hævde, at CarUpgrade kun opererer på Sjælland.
- Lokationsspecifikke sider skal fortsat have præcis lokal tekst og metadata.
- Projektets eksisterende integrationstests skal bestå.
