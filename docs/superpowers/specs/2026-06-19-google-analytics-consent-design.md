# Google Analytics med samtykke på Carupgrade

## Formål

Carupgrade skal måle trafik i Google Analytics med målings-id `G-130SMNH86Q` uden at kontakte Google eller sætte analytics-cookies, før den besøgende aktivt har accepteret statistikcookies.

## Omfang

Løsningen gælder alle 17 statiske HTML-sider i repositoryet. Den omfatter:

- et fælles cookiebanner som bundbjælke;
- valgene **Afvis** og **Accepter** med samme visuelle vægt og tydelig tekst;
- lagring af brugerens valg lokalt i browseren;
- betinget indlæsning af Google-tagget efter accept;
- et permanent link med teksten **Cookieindstillinger** i footeren på alle sider;
- opdatering af cookie- og privatlivspolitikken;
- automatiske kontroller af, at integrationen findes præcis én gang på hver HTML-side.

## Arkitektur

En fælles JavaScript-fil i `assets/` ejer hele samtykkeflowet. En fælles CSS-fil i `assets/` ejer bannerets udseende og responsive opførsel. Hver HTML-side refererer én gang til de to filer i `<head>` og indeholder et link til cookieindstillinger i footeren.

JavaScript-filen opretter bannerets HTML dynamisk. Det undgår at kopiere banner-markup og logik til 17 sider og sikrer ens adfærd overalt.

## Samtykkeflow

Ved første besøg læses den lokale samtykkestatus:

1. Hvis der ikke findes et valg, vises bundbjælken. Google-tagget indlæses ikke.
2. Ved **Afvis** gemmes afvisningen, banneret lukkes, og der sendes ingen data til Google.
3. Ved **Accepter** gemmes accepten, banneret lukkes, og `gtag.js` indlæses fra Google med målings-id `G-130SMNH86Q`.
4. Ved senere sidevisninger indlæses Analytics automatisk, hvis det gemte valg er accept. Ved afvisning forbliver Analytics deaktiveret.
5. Linket **Cookieindstillinger** nulstiller det gemte valg og viser banneret igen. Hvis Analytics allerede er indlæst på den aktuelle side, gælder et nyt afslag fuldt ud fra næste sideindlæsning; siden genindlæses derfor efter ændringen, så den nye status får øjeblikkelig virkning.

Samtykkestatus gemmes under en versionsstyret nøgle i `localStorage`. En ny version kan senere tvinge et nyt valg, hvis formål eller leverandører ændres.

## Google-tag

Efter accept opretter løsningen `window.dataLayer`, definerer `gtag`, sender initialiseringshændelsen og konfigurerer `G-130SMNH86Q`. Det eksterne script-element oprettes kun én gang pr. side. Funktionen er idempotent, så gentagne kald ikke kan tilføje flere Google-tags.

## Brugergrænseflade og tilgængelighed

Banneret følger Carupgrades mørke design med rød accent og ligger fast nederst på siden. På små skærme stables tekst og handlinger, så knapperne forbliver lette at ramme.

Banneret har semantisk dialogstatus, et tilgængeligt navn og tydelig tastaturfokus. Knapperne kan betjenes med tastatur. Linket til cookiepolitikken indgår i teksten, og **Afvis** er ikke visuelt eller funktionelt vanskeligere end **Accepter**.

## Politiktekster

Cookiepolitikken ændres fra at sige, at siden ikke anvender cookies eller Google Analytics, til at beskrive Google Analytics som en valgfri statistikleverandør. Den beskriver formål, leverandør, samtykke, tilbagekaldelse og henviser til Googles aktuelle oplysninger om cookies og opbevaring.

Privatlivspolitikken ændres, så den ikke længere siger, at tracking og statistikværktøjer ikke anvendes. Den henviser til cookiepolitikken og forklarer, at Analytics kun aktiveres efter samtykke.

## Fejlhåndtering

Hvis `localStorage` ikke er tilgængeligt, vises banneret ved hvert nyt besøg, og accept gælder kun for den aktuelle side. Hvis Google-scriptet ikke kan indlæses, påvirker det ikke resten af siden. Fejl må ikke blokere navigation, kontaktformular eller andet kerneindhold.

## Verifikation

Automatiske tests skal kontrollere:

- at alle 17 HTML-sider refererer samtykke-CSS og -JavaScript præcis én gang;
- at alle sider har linket **Cookieindstillinger**;
- at ingen side indeholder et direkte, ubetinget Google-tag;
- at Analytics-scriptet ikke oprettes før accept;
- at accept opretter præcis ét script med det korrekte målings-id;
- at afvisning ikke opretter scriptet;
- at gemt accept og afvisning respekteres ved næste indlæsning;
- at genåbning og ændring af samtykke virker;
- at cookie- og privatlivspolitikken ikke indeholder de nuværende modstridende udsagn.

Efter automatiske tests køres repositoryets fulde relevante test- og buildkommandoer. Banneret kontrolleres visuelt på desktop og mobil samt med tastaturnavigation.

## Ikke omfattet

Løsningen indfører ikke marketingcookies, annoncekonverteringer, Google Tag Manager, server-side tracking eller en ekstern consent management platform.
