Tema lietuvių kalba:
Asmeninių finansų sekimo internetinė informacinė sistema

Tema anglų kalba:
Personal finance tracker web app

Projekto idėjos aprašymas:
Kuriama naršyklėje veikianti asmeninio biudžeto stebėjimo internetinė informacinė sistema. Sistema leis įvesti finansines operacijas, jas kategorizuoti, peržiūrėti mėnesinį biudžeto balansą ir statistinę informaciją.

Atliko: Lukas Šerelis
Grupė: II
Vadovas: dr. Andrius Misiukas Misiūnas

# Pagrindinės technologijos
- Next.js and React: leidžia daryti Server-Side Rendering greitam krovimui ir turi puikų routingą.
- TypeScript: tipų saugumas padeda išvengti klaidų rašant kodą.
- Tailwind CSS: greitas UI konstravimas be didelio vargo su atskirais CSS failais.
- SQLite: lengva, nereikia atskiro serverio, viskas saugoma faile.
- Node.js: užtikrina sklandų API komunikaciją tarp front-end ir DB.
# Planuojamas funkcionalumas
## I iteracija
- Vartotojų CRUD ir autentifikacija (Login/Register).
	- Vartotojų patvirtinimo sistema: naujai užsiregistravę vartotojai gauna "Pending" statusą ir negali naudotis sistema, kol administratorius jų nepatvirtina.
	- Administratoriaus panelė: galimybė administratoriui matyti visus vartotojus, juos redaguoti, trinti arba keisti jų statusą (pirmas užsiregistravęs vartotojas automatiškai tampa admin).
- Mėnesio sheets kūrimas.
- Pajamų/Išlaidų kategorijų CRUD: galimybė susikurti savo pajamas ir išlaidas (pvz. "maistas" ar "alga"), nes be kategorijų nebus kur vesti duomenų.
## II iteracija
- Operacijų (Pajamų/Išlaidų) CRUD: galimybė įvesti ar redaguoti sumas, priskirti datas ir kategorijas.
- Finansinės būsenos suvestinė (Dashboard): pagrindinis ekranas, rodantis tam tikras statistikas ir palyginimus paskutinių mėnesių ar dienų.
- Dark ir White Theme.
## III iteracija
- Mėnesio Dashboard: sistema analizuoja praėjusį mėnesį ir pateikia įžvalgas (pvz. "šį mėnesį maistui išleidote 20% daugiau nei vidutiniškai").
	- Rodo dabartinį balansą (pliusas/minusas) ir pajamas/išlaidas pagal kategorijas. 
	- Turto (Capital) sekimas: skirstymas į Savings, Cash ir t.t. su procentiniu pasiskirstymu.
- Profilio dalinimasis: galimybė suteikti prieigą kitam registruotam vartotojui peržiūrėti tavo mėnesio ataskaitas.
## IV iteracija
- Pasikartojančios operacijos: galimybė nustatyti, kad "Nuoma" ar "Alga" įsirašytų automatiškai kas mėnesį.
- Išlaidų skaidymas: galimybė vienkartines metines prenumeratas ar stambius pirkinius tolygiai paskirstyti per pasirinktą mėnesių skaičių. Tai leidžia vartotojui matyti realų mėnesio biudžeto apkrovimą, o ne vienkartinį "duobėtą" balansą.
- Adaptyvus dizainas: optimizacija, kad viskas atrodytų gražiai tiek ant kompiuterio tiek ant telefono.
# Nefunkciniai reikalavimai
- Prieinamumas: sistema turi palaikyti Dark/White režimus ne tik dėl estetikos, bet ir dėl vartotojų, turinčių regos sutrikimų.
- Privatumas: po pasidalinimo profiliu, vartotojas turi turėti galimybę bet kada atšaukti prieigą kitam vartotojui.
- Našumas: net ir turint daug operacijų, balanso skaičiavimas ir apžvalga turi būti generuojami greičiau nei per 1 sekundę.
# Inspiracija
![[image-10.png|1 pav. Vieno mėnesio apžvalga|664]]
# Vizija
## Mobile

| ![[image-7.png\|2 pav. Dashboard [1] \|220]] | ![[image-9.png\|3 pav. Operacijos [1] \|220]] |
| -------------------------------------------- | --------------------------------------------- |
## Computer
![[image-11.png|4 pav. Dashboard [2] |614]]
<div class="page-break" style="page-break-before: always;"></div>

# Use-case UML diagrama

![[UML.png|5 pav. Use-case UML diagrama]]
Sistema skirstoma į tris tipus vartotojų: pagrindinį vartotoją, administratorių bei kitą registruotą vartotoją, kuriam gali būti suteikta prieiga prie kito profilio peržiūros. 

Administratorius šioje architektūroje paveldi visas paprasto vartotojo teises, tačiau papildomai turi išskirtines teises valdyti naudotojų sąrašą bei patvirtinti naujas registracijas.

Vartotojas gali registruotis, prisijungti, valdyti kategorijas ir operacijas, peržiūrėti dabartinį ir senesnius mėnesius, įvesti ir sekti savo turtą, peržiūrėti mėnesio įžvalgas, keisti temą, pasidalinti profiliu ir peržiūrėti kito vartotojo profilį.
<div class="page-break" style="page-break-before: always;"></div>

# Scheme of database
![[image-12.png|6 pav. Scheme of database|797]]

Duomenų bazės schema atspindi informacinės sistemos struktūrą, kurios pagrindas yra sheets modelis. 

Siekiant užtikrinti pajamų ir išlaidų atskyrimą Category lentelė turi type atributą. Tai leidžia vartotojo sąsajai filtruoti kategorijas: pildant išlaidų operaciją, vartotojui pateikiamos tik išlaidų tipo kategorijos ir atvirkščiai. 

Lentelė MonthlySheet yra pagrindinis mėnesio sesijos identifikatorius, prie kurio yra jungiami visi to laikotarpio finansiniai įvykiai ir turto operacijos.

Ryšiai tarp lentelių nustatyti naudojant išorinius raktus, o vartotojų teisių valdymas ir profilių dalinimasis realizuojamas per User ir SharedAccess lentelių sąveiką.
<div class="page-break" style="page-break-before: always;"></div>

# Activity UML diagrama
![[activity.png|7 pav. Activity UML diagrama]]

Sistema suprojektuota taip, kad pirmasis užsiregistravęs asmuo automatiškai įgyja administratoriaus teises, o vėlesni vartotojai privalo laukti jo patvirtinimo. Sėkmingai prisijungus, sistema atlieka automatinį mėnesio sheet inicijavimą: patikrina einamąją datą, sukuria naują darbo erdvę ir įrašo pasikartojančias operacijas.

Sistemos navigacija pavaizduota naudojant split blokus, kurie geriausiai atspindi tabs principu veikiančią vartotojo sąsają. Vartotojas gali laisvai rinktis tarp globalių nustatymų (temos keitimas, profilio dalinimasis) arba konkretaus mėnesio sheet valdymo. Sheet'o viduje logika skirstoma į tris izoliuotus modulius: pajamos, išlaidos ir mėnesio apžvalga.
<div class="page-break" style="page-break-before: always;"></div>

# UML class diagrama
![[image-13.png|8 pav. UML class diagrama|542]]
Naudojamas generalization ryšys tarp User ir Admin klasių parodo, kad administratorius paveldi visus bazinio vartotojo duomenis ir funkcijas, tačiau papildomai turi metodus vartotojų patvirtinimui ir valdymui.

MonthlySheet klasė ne tik saugo ryšius su operacijomis ir turto fiksavimu, bet ir turi loginius metodus (calculateTotalBalance, getMLInsights), kurie atsakingi už dinaminį duomenų apdorojimą ir analitikos generavimą vartotojui.

Ryšiai tarp klasių nurodo griežtą priklausomybę, pavyzdžiui, operacijos ir turto įrašai negali egzistuoti be konkretaus mėnesio lakšto, o kategorijų filtravimas pagal tipą (INCOME, EXPENSE) užtikrinamas per TransactionType.
<div class="page-break" style="page-break-before: always;"></div>

# Literatūros ir šaltinių sąrašas
[1] [Fintrack app — AI-Powered Personal Finance app](https://www.figma.com/community/file/1437411417620577539)
[2] [Financial Tracker Dashboard Redesign](https://dribbble.com/shots/22643245-Financial-Tracker-Dashboard-Redesign)

