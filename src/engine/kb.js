// RUKA knowledge base (prototype).
// Every entry carries institution, academic year, document, article, page and a `basis`:
//   read     = wording read directly in the official document while building this prototype
//   summary  = reported by an institutional summary page (confirm in the official document)
//   title    = only the article heading is known; content is NOT indexed yet
//   demo     = development placeholder, never shown to users as a rule
// Page numbers are the printed page numbers of the PDF.

export const AY = '2026/27';
export const LAST_VERIFIED = '2026-09-19';

export const INSTITUTIONS = [
  { id: 'edisu', name: 'EDISU Piemonte', short: 'EDISU', domains: ['edisu.piemonte.it'], status: 'live' },
  { id: 'polito', name: 'Politecnico di Torino', short: 'PoliTO', domains: ['polito.it'], status: 'live' },
  { id: 'unito', name: 'Università degli Studi di Torino', short: 'UniTo', domains: ['unito.it'], status: 'planned' },
];

const BANDO_URL =
  'https://www.edisu.piemonte.it/sites/default/files/documentazione/bandi-di-concorso/Bando_borsa_di_studio_servizio_abitativo_premio_di_laurea_contributo_studenti_con_disabilit%C3%A0_dal_46_p.c._iscritti_al_collocamento_mirato_a.a._2026-27_0.pdf';

export const DOCS = {
  bando: { id: 'edisu-bando-2026-27', inst: 'edisu', ay: '2026/27', name: 'Bando di concorso a.a. 2026/27', type: 'bando', url: BANDO_URL, published: '2026-07-22' },
  edisuPage: { id: 'edisu-scholarship-page', inst: 'edisu', ay: '2026/27', name: 'EDISU – Scholarship and grants (web page)', type: 'web_page', url: 'https://www.edisu.piemonte.it/en/scholarships-and-grants/financial-benefits/scholarship-and-grants', published: null },
  regione: { id: 'regione-news-bando-2026-27', inst: 'edisu', ay: '2026/27', name: 'Regione Piemonte – Edisu, bando 2026-2027', type: 'institutional_news', url: 'https://www.regione.piemonte.it/web/pinforma/notizie/edisu-bando-per-borse-studio-2026-2027', published: '2026-07-21' },
  upo: { id: 'upo-summary-bando-2026-27', inst: 'edisu', ay: '2026/27', name: 'UPO – summary of the EDISU 2026/27 bando', type: 'institutional_summary', url: 'https://mediacentre.uniupo.it/it/news/bando-edisu-20262027-borse-di-studio-servizi-studentesse-studenti-upo', published: '2026-08-04' },
  politoArch: { id: 'polito-arch-lm-deadlines-2026-27', inst: 'polito', ay: '2026/27', name: 'PoliTO – Scadenze Area Architettura (LM) a.a. 2026/27', type: 'web_page', url: 'https://www.polito.it/didattica/iscriversi-studiare-laurearsi/iscrizione/corsi-di-laurea-magistrale/studenti-con-titolo-italiano/scadenze-area-architettura-aa-202627', published: null },
  politoReg: { id: 'polito-regolamento-immatricolazione-2026-27', inst: 'polito', ay: '2026/27', name: 'PoliTO – Regolamento per l\'immatricolazione a.a. 2026/27 (D.R. 382/2026)', type: 'regulation', url: 'https://www.polito.it/didattica/iscriversi-studiare-laurearsi/iscrizione/corsi-di-laurea/bandi-regolamenti-e-graduatorie/bandi-e-regolamenti-26-27', published: '2026-04-10' },
  politoEng: { id: 'polito-eng-lm-admission-2026-27', inst: 'polito', ay: '2026/27', name: 'PoliTO – Ammissione LM Area Ingegneria a.a. 2026/27', type: 'web_page', url: 'https://www.polito.it/didattica/iscriversi-studiare-laurearsi/iscrizione/corsi-di-laurea-magistrale/studenti-con-titolo-italiano/area-ingegneria-aa-20262027', published: null },
  demo25: { id: 'demo-2025-26', inst: 'edisu', ay: '2025/26', name: 'DEMO placeholder for 2025/26 (not a real document)', type: 'demo', url: '', published: null },
};

// Reusable citation anchors: { doc, article, page, basis }
export const S = {
  deadlines: { doc: 'bando', article: 'Table of main deadlines', page: 3, basis: 'read' },
  novelties: { doc: 'bando', article: 'Novità (what is new in 2026/27)', page: 2, basis: 'read' },
  isee: { doc: 'bando', article: 'Art. 6 c.1', page: 19, basis: 'read' },
  iseeTable: { doc: 'bando', article: 'Art. 6 c.1.1', page: 20, basis: 'read' },
  incomeYear: { doc: 'bando', article: 'Art. 6 c.1.2', page: 21, basis: 'read' },
  parificato: { doc: 'bando', article: 'Art. 6 c.5', page: 25, basis: 'read' },
  parificatoIt: { doc: 'bando', article: 'Art. 6 c.5.1', page: 26, basis: 'read' },
  indep: { doc: 'bando', article: 'Art. 6 c.1.5', page: 22, basis: 'read' },
  studentType: { doc: 'bando', article: 'Art. 4', page: 14, basis: 'read' },
  amountsFs: { doc: 'bando', article: 'Art. 5 c.1.3', page: 16, basis: 'read' },
  partTime: { doc: 'bando', article: 'Art. 5 c.2', page: 18, basis: 'read' },
  exclusion: { doc: 'bando', article: 'Art. 3 c.2', page: 13, basis: 'read' },
  nonAdmission: { doc: 'bando', article: 'Art. 3 c.1', page: 12, basis: 'read' },
  tempCode: { doc: 'bando', article: 'Art. 7 c.1.2', page: 27, basis: 'read' },
  lodging: { doc: 'bando', article: 'Art. 8 (paid-lodging declaration)', page: 33, basis: 'title' },
  bedAccept: { doc: 'bando', article: 'Art. 33 (accepting the bed)', page: 84, basis: 'title' },
  firstYearMerit: { doc: 'upo', article: 'Merit summary (bando Art. 13 c.1)', page: null, basis: 'summary' },
  firstYearMeritBando: { doc: 'bando', article: 'Art. 13 c.1 (second-instalment merit)', page: 45, basis: 'title' },
  deferral: { doc: 'bando', article: 'Art. 13 c.7 (deadline deferral to 30 Nov 2027)', page: 49, basis: 'title' },
  laterMerit: { doc: 'bando', article: 'Art. 15 c.2 (merit, later years)', page: 52, basis: 'title' },
  suspended: { doc: 'bando', article: 'Art. 12 c.5.4 (students "sospesi" in December)', page: 44, basis: 'title' },
  suspendedBed: { doc: 'bando', article: 'Art. 34 c.6.2 (accommodation, "sospeso" outcome)', page: 91, basis: 'title' },
  payment: { doc: 'bando', article: 'Art. 13 c.4 and Art. 18 c.1 (payment period)', page: 46, basis: 'title' },
  intl: { doc: 'bando', article: 'Art. 30–31 (international students)', page: 72, basis: 'title' },
  enrolMaster: { doc: 'bando', article: 'Art. 11 c.2 (first-year master\'s not enrolled by 30 Nov 2026)', page: 41, basis: 'title' },
  transfer: { doc: 'bando', article: 'Art. 15 c.4 (changes of course and transfers)', page: 54, basis: 'title' },
  politoArch: { doc: 'politoArch', article: 'Deadlines table', page: null, basis: 'read' },
  politoReg: { doc: 'politoReg', article: 'Regulation index page', page: null, basis: 'title' },
  politoEng: { doc: 'politoEng', article: 'Admission procedure page', page: null, basis: 'read' },
  regione: { doc: 'regione', article: 'News release', page: null, basis: 'read' },
};

// Retrievable chunks (paraphrased, short). text.si falls back to English.
export const CHUNKS = [
  { id: 'c-deadlines', inst: 'edisu', ay: '2026/27', cite: 'deadlines', topics: ['deadlines', 'ranking', 'accommodation', 'scholarship'],
    text: { en: 'Applications for degree, master\'s and single-cycle students ran from 22 July to 4 September 2026 (12:00). Provisional accommodation ranking: 11 September; definitive: 25 September. Provisional scholarship ranking: 21 October; definitive: 9 November (some first years) and 16 December (general).',
            it: 'Le domande per laurea, laurea magistrale e ciclo unico erano aperte dal 22 luglio al 4 settembre 2026 (ore 12:00). Graduatoria provvisoria del posto letto: 11 settembre; definitiva: 25 settembre. Graduatoria provvisoria di borsa: 21 ottobre; definitive: 9 novembre (alcuni primi anni) e 16 dicembre (generale).' } },
  { id: 'c-isee', inst: 'edisu', ay: '2026/27', cite: 'isee', topics: ['isee', 'eligibility', 'income'],
    text: { en: 'The 2026 ISEE Universitario (or the ISEE Parificato calculated by EDISU) must not exceed €26,306.25, and the ISPE (assets indicator) must not exceed €57,187.53. The ISEE must be signed from 1 January 2026 and include the university-benefits section (quadro C).',
            it: 'L\'ISEE Universitario 2026 (o l\'ISEE Parificato calcolato da EDISU) non può superare € 26.306,25 e l\'ISPE non può superare € 57.187,53. L\'ISEE deve essere sottoscritto dal 1° gennaio 2026 e includere il quadro C (prestazioni universitarie).' } },
  { id: 'c-parificato-route', inst: 'edisu', ay: '2026/27', cite: 'iseeTable', topics: ['isee', 'parificato', 'international', 'income'],
    text: { en: 'If the whole family lives in Italy you need an ISEE Universitario. If the whole family lives abroad you need an ISEE Parificato based on consular documents. If the family lives partly in Italy and partly abroad, the ISEE Parificato is integrated with an ordinary ISEE for the members in Italy. Refugees, beneficiaries of protection and stateless students use an ISEE Universitario based on their household in Italy.',
            it: 'Se l\'intero nucleo risiede in Italia serve l\'ISEE Universitario. Se l\'intero nucleo risiede all\'estero serve l\'ISEE Parificato basato sulla documentazione consolare. Se il nucleo risiede in parte in Italia e in parte all\'estero, l\'ISEE Parificato è integrato con un ISEE ordinario per i componenti in Italia. Rifugiati, titolari di protezione e apolidi usano l\'ISEE Universitario del nucleo in Italia.' } },
  { id: 'c-parificato-docs', inst: 'edisu', ay: '2026/27', cite: 'parificato', topics: ['isee', 'parificato', 'documents', 'international'],
    text: { en: 'EDISU only accepts an ISEE Parificato calculated at EDISU by its partner CAAF operators, after the consular documents (translated and legalised) are judged complete. Italian citizens who need it can upload at most 5 PDF files of 1 MB each. Documents must refer to income of 2024 and assets at 31/12/2024 (Italian and EU students); extra-EU students use 2025 income and assets at 31/12/2025.',
            it: 'EDISU accetta solo l\'ISEE Parificato calcolato da EDISU tramite i CAAF convenzionati, dopo la valutazione della documentazione consolare (tradotta e legalizzata). Gli studenti italiani che ne hanno bisogno possono caricare al massimo 5 PDF da 1 MB. I documenti si riferiscono ai redditi 2024 e al patrimonio al 31/12/2024 (studenti italiani e UE); gli studenti extra-UE usano i redditi 2025 e il patrimonio al 31/12/2025.' } },
  { id: 'c-student-type', inst: 'edisu', ay: '2026/27', cite: 'studentType', topics: ['accommodation', 'scholarship', 'student_type'],
    text: { en: 'Amounts depend on student type. In sede: resident in the city of the course. Pendolare (commuter): resident elsewhere but reachable by public transport in 60 minutes. Fuori sede (non-resident): not reachable in 60 minutes. A fuori sede student gets the higher amount only with a paid-lodging declaration (or an EDISU bed); otherwise the commuter amount applies. Residence on 12 November 2026 is the reference date.',
            it: 'Gli importi dipendono dalla tipologia. In sede: residente nel comune sede del corso. Pendolare: residente altrove ma raggiungibile con i mezzi pubblici entro 60 minuti. Fuori sede: non raggiungibile entro 60 minuti. Lo studente fuori sede ottiene l\'importo maggiore solo con la dichiarazione di alloggio a titolo oneroso (o con un posto letto EDISU); altrimenti si applica l\'importo da pendolare. Fa fede la residenza al 12 novembre 2026.' } },
  { id: 'c-lodging', inst: 'edisu', ay: '2026/27', cite: 'amountsFs', topics: ['accommodation', 'lodging'],
    text: { en: 'To receive the non-resident scholarship amount without an EDISU bed you must be a winner in the definitive scholarship ranking and have submitted the paid-lodging declaration. The deadlines table lists 21 Oct–4 Nov 2026 (first years enrolled by 31 Oct), 21 Oct–19 Nov 2026 (general) and 19 Mar–9 Apr 2027 (suspended) in the paid-lodging column; the exact rule is in Art. 8 c.2.3.',
            it: 'Per ricevere l\'importo da fuori sede senza posto letto EDISU bisogna essere vincitori nella graduatoria definitiva di borsa e aver presentato la dichiarazione di alloggio a titolo oneroso. La tabella scadenze indica 21/10–04/11/2026 (primi anni con immatricolazione entro il 31/10), 21/10–19/11/2026 (generale) e 19/03–09/04/2027 (sospesi) nella colonna alloggio oneroso; la regola esatta è all\'art. 8 c.2.3.' } },
  { id: 'c-bed', inst: 'edisu', ay: '2026/27', cite: 'deadlines', topics: ['accommodation', 'ranking'],
    text: { en: 'Accommodation ranking: provisional 11 September, complaints until 16 September (12:00), definitive 25 September. Winners accept the bed online and "idonei" (eligible, no bed yet) declare interest online between 25 and 29 September 2026 (12:00). Declining the bed can change the scholarship amount to the commuter amount.',
            it: 'Graduatoria posto letto: provvisoria 11 settembre, reclami fino al 16 settembre (ore 12:00), definitiva 25 settembre. I vincitori accettano il posto online e gli idonei dichiarano interesse online dal 25 al 29 settembre 2026 (ore 12:00). Rifiutare il posto può far passare la borsa all\'importo da pendolare.' } },
  { id: 'c-first-merit', inst: 'edisu', ay: '2026/27', cite: 'firstYearMerit', topics: ['cfu', 'merit', 'payment'],
    text: { en: 'First-year students enter with their qualification only. To keep the benefit and unlock the second instalment they need at least 20 CFU (full-time enrolment) or 11 CFU (part-time) by 10 August 2027.',
            it: 'Le matricole accedono con il solo titolo di studio. Per mantenere il beneficio e sbloccare la seconda rata servono almeno 20 CFU (tempo pieno) o 11 CFU (tempo parziale) entro il 10 agosto 2027.' } },
  { id: 'c-later-merit', inst: 'edisu', ay: '2026/27', cite: 'laterMerit', topics: ['cfu', 'merit'],
    text: { en: 'Students in later years must have the minimum CFU for their year of course by 10 August 2026 to apply. The exact table is in Art. 15 c.2 and the annexes and is not indexed in Ruka yet.',
            it: 'Gli studenti degli anni successivi devono avere i CFU minimi previsti per il loro anno entro il 10 agosto 2026. La tabella esatta è all\'art. 15 c.2 e negli allegati e non è ancora indicizzata in Ruka.' } },
  { id: 'c-suspended', inst: 'edisu', ay: '2026/27', cite: 'suspended', topics: ['ranking', 'suspended'],
    text: { en: '"Sospeso" is an outcome in the definitive ranking of 16 December 2026. Suspended students are re-evaluated in a later ranking: provisional 19 March 2027, complaints 19 March–2 April, definitive 30 April 2027. The bando also has a specific rule for suspended accommodation outcomes. The reason for your own suspension is shown in your ranking notes; the general rules are in Art. 12 c.5.4.',
            it: '"Sospeso" è un esito della graduatoria definitiva del 16 dicembre 2026. Gli studenti sospesi vengono rivalutati in una graduatoria successiva: provvisoria 19 marzo 2027, reclami 19 marzo–2 aprile, definitiva 30 aprile 2027. Il bando prevede anche una regola specifica per l\'esito "sospeso" del posto letto. Il motivo della tua sospensione è indicato nelle note della graduatoria; le regole generali sono all\'art. 12 c.5.4.' } },
  { id: 'c-ranking-terms', inst: 'edisu', ay: '2026/27', cite: 'deadlines', topics: ['ranking'],
    text: { en: 'Vincitore (winner) receives the benefit. Idoneo (eligible) meets the requirements but receives the benefit only if funds or beds are available. Escluso (excluded) does not meet a requirement. A complaint (reclamo) is the only way to correct data on a provisional ranking.',
            it: 'Vincitore riceve il beneficio. Idoneo soddisfa i requisiti ma riceve il beneficio solo se ci sono fondi o posti disponibili. Escluso non soddisfa un requisito. Il reclamo è l\'unico modo per correggere i dati di una graduatoria provvisoria.' } },
  { id: 'c-payment', inst: 'edisu', ay: '2026/27', cite: 'payment', topics: ['payment'],
    text: { en: 'The payment period and instalment rules are in Art. 13 c.4 and Art. 18 c.1 of the bando. Those articles are not indexed in Ruka yet, so no payment dates are shown here.',
            it: 'Il periodo di erogazione e le rate sono negli art. 13 c.4 e 18 c.1 del bando. Questi articoli non sono ancora indicizzati in Ruka, quindi qui non vengono mostrate date di pagamento.' } },
  { id: 'c-intl', inst: 'edisu', ay: '2026/27', cite: 'tempCode', topics: ['international', 'documents'],
    text: { en: 'International students without SPID apply with a Temporary Access Code (valid to 30 June 2027; issuing can take up to 6 hours). They print, hand-sign (or digitally sign) the application, and upload it with an ID document as PDF (1 MB max). Students who need an entry visa must attach visa D. Annex F (English) lists the authorities that issue accepted consular documents.',
            it: 'Gli studenti internazionali senza SPID presentano domanda con il Codice Temporaneo d\'Accesso (valido fino al 30 giugno 2027; il rilascio può richiedere fino a 6 ore). Stampano, firmano a mano (o con firma digitale) la domanda e la allegano con un documento d\'identità in PDF (max 1 MB). Chi ha bisogno del visto d\'ingresso deve allegare il visto D. L\'Allegato F (in inglese) elenca gli enti che rilasciano i documenti consolari accettati.' } },
  { id: 'c-indep', inst: 'edisu', ay: '2026/27', cite: 'indep', topics: ['isee', 'eligibility'],
    text: { en: 'An independent student needs residence outside the family home for at least two years and personal income of at least €9,000 in each of 2024 and 2025, and must attach a rental contract or property deed.',
            it: 'Lo studente indipendente deve risiedere fuori dalla casa familiare da almeno due anni, avere un reddito personale di almeno € 9.000 sia nel 2024 sia nel 2025 e allegare contratto di affitto o atto di proprietà.' } },
  { id: 'c-enrol-checks', inst: 'edisu', ay: '2026/27', cite: 'partTime', topics: ['enrollment', 'scholarship'],
    text: { en: 'EDISU verifies enrolment and full-time/part-time status on 31 October 2026 (first-year bachelor/single-cycle enrolling by then), on 30 November 2026 (first and later years enrolling by then) and on 2 April 2027 (suspended students). Part-time winners receive the part-time amount even if they switch to full-time later. Winners must not withdraw before 1 June 2027.',
            it: 'EDISU verifica iscrizione e tipo di impegno il 31 ottobre 2026 (primi anni di laurea/ciclo unico che si immatricolano entro tale data), il 30 novembre 2026 (primi anni e anni successivi che si iscrivono entro tale data) e il 2 aprile 2027 (studenti sospesi). Chi risulta a tempo parziale riceve l\'importo part-time anche se passa poi a tempo pieno. I vincitori non devono rinunciare agli studi prima del 1° giugno 2027.' } },
  { id: 'c-master-late', inst: 'edisu', ay: '2026/27', cite: 'enrolMaster', topics: ['enrollment', 'scholarship'],
    text: { en: 'The bando has a specific article for first-year master\'s students who do not enrol by 30 November 2026 (Art. 11 c.2). Its content is not indexed in Ruka yet — read it before deciding anything.',
            it: 'Il bando ha un articolo specifico per gli studenti di primo anno di laurea magistrale che non si immatricolano entro il 30 novembre 2026 (art. 11 c.2). Il contenuto non è ancora indicizzato in Ruka: leggilo prima di decidere.' } },
  { id: 'c-transfer', inst: 'edisu', ay: '2026/27', cite: 'exclusion', topics: ['transfer', 'scholarship'],
    text: { en: 'A transfer or change of programme that leads to credits not being recognised for the merit requirement excludes you from the benefits. Transferring to a non-Piedmont university, freezing or suspending your career, or withdrawing before 1 June 2027 are also grounds for exclusion. Enrolling in the first year through a change of programme or transfer is a ground for non-admission when applying as a first year.',
            it: 'Un trasferimento o passaggio di corso che comporta il mancato riconoscimento dei crediti necessari per il merito determina l\'esclusione. Anche il trasferimento a un ateneo non piemontese, il congelamento o la sospensione della carriera o la rinuncia agli studi prima del 1° giugno 2027 sono cause di esclusione. L\'iscrizione al primo anno a seguito di passaggio di corso o trasferimento è causa di non ammissione per la domanda da primo anno.' } },
  { id: 'c-polito-arch', inst: 'polito', ay: '2026/27', cite: 'politoArch', topics: ['enrollment', 'deadlines', 'polito'],
    text: { en: 'Architecture area master\'s (2026/27): transfer requests from other universities by 18 September 2026; enrolment (1st teaching period) by 30 September 2026, or by 2 November 2026 in the second timetable on the page; identity recognition for students from other universities by 3 December 2026. The page lists two timetables — check which one matches your course.',
            it: 'LM Area Architettura (2026/27): richieste di trasferimento da altri atenei entro il 18 settembre 2026; immatricolazione (1° periodo didattico) entro il 30 settembre 2026, oppure entro il 2 novembre 2026 nel secondo calendario riportato nella pagina; riconoscimento identità per studenti di altri atenei entro il 3 dicembre 2026. La pagina riporta due calendari: verifica quale corrisponde al tuo corso.' } },
  { id: 'c-polito-eng', inst: 'polito', ay: '2026/27', cite: 'politoEng', topics: ['enrollment', 'polito'],
    text: { en: 'Engineering master\'s applications go through Apply@polito (up to 2 courses). You can apply before graduating if you have passed at least 140 credits. Enrolment deadlines for Engineering are not indexed in Ruka yet — see the official page.',
            it: 'Le candidature alle LM di Ingegneria passano da Apply@polito (fino a 2 corsi). Puoi candidarti prima della laurea se hai superato almeno 140 crediti. Le scadenze di immatricolazione per Ingegneria non sono ancora indicizzate in Ruka: consulta la pagina ufficiale.' } },
  { id: 'c-docs', inst: 'edisu', ay: '2026/27', cite: 'isee', topics: ['documents'],
    text: { en: 'Typical items: a 2026 ISEE Universitario (or the DSU receipt), SPID/CIE access (or the Temporary Access Code plus a signed application and ID for international students), the 2025 Certificazione Unica if you received a scholarship in 2024, IBAN, and — depending on your case — consular documents, rental contract (independent students) or visa D.',
            it: 'Voci tipiche: ISEE Universitario 2026 (o ricevuta della DSU), accesso con SPID/CIE (o Codice Temporaneo con domanda firmata e documento d\'identità per gli studenti internazionali), Certificazione Unica 2025 se nel 2024 hai percepito una borsa, IBAN e, a seconda del caso, documentazione consolare, contratto di affitto (studenti indipendenti) o visto D.' } },
  { id: 'c-novelties', inst: 'edisu', ay: '2026/27', cite: 'novelties', topics: ['updates'],
    text: { en: 'New in 2026/27: updated amounts, an extra semester of scholarship for part-time students, separate payment of the second-course supplement, visa D attachment for international students, and an English guide to consular documents (Annex F).',
            it: 'Novità 2026/27: importi aggiornati, un semestre aggiuntivo di borsa per gli iscritti part-time, pagamento separato dell\'integrazione per secondo corso, allegazione del visto D per gli studenti internazionali e guida in inglese ai documenti consolari (Allegato F).' } },
  { id: 'c-demo-2526', inst: 'edisu', ay: '2025/26', cite: null, basis: 'demo', topics: ['cfu', 'merit'],
    text: { en: 'DEMO ONLY: placeholder that stands in for a 2025/26 rule. It must never be used for 2026/27 answers.', it: 'SOLO DEMO: segnaposto per una regola 2025/26. Non deve mai essere usato per risposte 2026/27.' } },
];

// Deadlines. `applies`: all | first_year_bs | first_year_master | later | accommodation | fuori_sede | suspended | international | winners
export const DEADLINES = [
  { id: 'd-app', inst: 'edisu', date: '2026-09-04', time: '12:00', tags: ['scholarship', 'accommodation'], applies: ['all'], cite: 'deadlines', title: { en: 'Application deadline (scholarship and accommodation)', it: 'Scadenza domanda (borsa e posto letto)', si: 'අයදුම්පත් අවසන් දිනය (ශිෂ්‍යත්වය සහ නවාතැන)' } },
  { id: 'd-acc-prov', inst: 'edisu', date: '2026-09-11', tags: ['accommodation', 'rankings'], applies: ['accommodation'], cite: 'deadlines', title: { en: 'Provisional accommodation ranking', it: 'Graduatoria provvisoria posto letto', si: 'නවාතැන් තාවකාලික ශ්‍රේණිගත කිරීම' } },
  { id: 'd-acc-compl', inst: 'edisu', date: '2026-09-16', time: '12:00', tags: ['accommodation', 'rankings'], applies: ['accommodation'], cite: 'deadlines', title: { en: 'Complaints on provisional accommodation ranking', it: 'Reclami graduatoria provvisoria posto letto', si: 'නවාතැන් තාවකාලික ශ්‍රේණිගත කිරීමට පැමිණිලි' } },
  { id: 'd-acc-def', inst: 'edisu', date: '2026-09-25', tags: ['accommodation', 'rankings'], applies: ['accommodation'], cite: 'deadlines', title: { en: 'Definitive accommodation ranking', it: 'Graduatoria definitiva posto letto', si: 'නවාතැන් අවසාන ශ්‍රේණිගත කිරීම' } },
  { id: 'd-acc-accept', inst: 'edisu', start: '2026-09-25', date: '2026-09-29', time: '12:00', tags: ['accommodation'], applies: ['accommodation'], cite: 'bedAccept', title: { en: 'Accept the bed / declare interest', it: 'Accettazione posto letto / dichiarazione di interesse', si: 'නවාතැන පිළිගන්න / උනන්දුව ප්‍රකාශ කරන්න' } },
  { id: 'd-sch-prov', inst: 'edisu', date: '2026-10-21', tags: ['scholarship', 'rankings'], applies: ['all'], cite: 'deadlines', title: { en: 'Provisional scholarship rankings', it: 'Graduatorie provvisorie di borsa', si: 'ශිෂ්‍යත්ව තාවකාලික ශ්‍රේණිගත කිරීම්' } },
  { id: 'd-lodging-fy', inst: 'edisu', start: '2026-10-21', date: '2026-11-04', time: '12:00', tags: ['accommodation', 'scholarship'], applies: ['fuori_sede', 'first_year_bs'], cite: 'lodging', title: { en: 'Paid-lodging declaration (first-year bachelor/single-cycle enrolled by 31 Oct)', it: 'Dichiarazione alloggio oneroso (primi anni laurea/ciclo unico immatricolati entro il 31/10)', si: 'ගෙවන නවාතැන් ප්‍රකාශය (පළමු වසර)' } },
  { id: 'd-compl-fy', inst: 'edisu', start: '2026-10-21', date: '2026-10-28', time: '12:00', tags: ['rankings', 'scholarship'], applies: ['first_year_bs'], cite: 'deadlines', title: { en: 'Complaints on provisional ranking (first-year bachelor/single-cycle enrolled by 31 Oct)', it: 'Reclami graduatoria provvisoria (primi anni laurea/ciclo unico immatricolati entro il 31/10)', si: 'තාවකාලික ශ්‍රේණිගත කිරීමට පැමිණිලි (පළමු වසර)' } },
  { id: 'd-enrol-oct', inst: 'edisu', date: '2026-10-31', tags: ['enrollment', 'scholarship'], applies: ['first_year_bs'], cite: 'partTime', title: { en: 'Enrol by this date to be in the 9 Nov definitive ranking (first-year bachelor/single-cycle)', it: 'Immatricolazione entro questa data per la graduatoria definitiva del 9/11 (primi anni laurea/ciclo unico)', si: 'නොවැම්බර් 9 අවසාන ශ්‍රේණිගත කිරීමට ඇතුළත් වීමට ලියාපදිංචි වන්න' } },
  { id: 'd-def-fy', inst: 'edisu', date: '2026-11-09', tags: ['rankings', 'scholarship'], applies: ['first_year_bs'], cite: 'deadlines', title: { en: 'Definitive ranking (first-year bachelor/single-cycle enrolled by 31 Oct)', it: 'Graduatoria definitiva (primi anni laurea/ciclo unico immatricolati entro il 31/10)', si: 'අවසාන ශ්‍රේණිගත කිරීම (පළමු වසර)' } },
  { id: 'd-residence', inst: 'edisu', date: '2026-11-12', tags: ['scholarship', 'accommodation'], applies: ['all'], cite: 'studentType', title: { en: 'Reference date for your residence (determines student type)', it: 'Data di riferimento della residenza (determina la tipologia di studente)', si: 'ඔබේ පදිංචිය සඳහා යොමු දිනය' } },
  { id: 'd-compl-gen', inst: 'edisu', start: '2026-10-21', date: '2026-11-12', time: '12:00', tags: ['rankings', 'scholarship'], applies: ['first_year_master', 'later'], cite: 'deadlines', title: { en: 'Complaints on provisional ranking (general: first-year master\'s and later years)', it: 'Reclami graduatoria provvisoria (generale: primo anno magistrale e anni successivi)', si: 'තාවකාලික ශ්‍රේණිගත කිරීමට පැමිණිලි (පොදු)' } },
  { id: 'd-lodging-gen', inst: 'edisu', start: '2026-10-21', date: '2026-11-19', time: '12:00', tags: ['accommodation', 'scholarship'], applies: ['fuori_sede', 'first_year_master', 'later'], cite: 'lodging', title: { en: 'Paid-lodging declaration (general ranking)', it: 'Dichiarazione alloggio oneroso (graduatoria generale)', si: 'ගෙවන නවාතැන් ප්‍රකාශය (පොදු)' } },
  { id: 'd-enrol-nov', inst: 'edisu', date: '2026-11-30', tags: ['enrollment', 'scholarship'], applies: ['first_year_master', 'later', 'first_year_bs'], cite: 'partTime', title: { en: 'Enrolment and full/part-time verification date', it: 'Data di verifica di iscrizione e tipo di impegno', si: 'ලියාපදිංචිය සහ පූර්ණ/අර්ධ කාලීන සත්‍යාපන දිනය' } },
  { id: 'd-def-gen', inst: 'edisu', date: '2026-12-16', tags: ['rankings', 'scholarship'], applies: ['all'], cite: 'deadlines', title: { en: 'Definitive general scholarship rankings', it: 'Graduatorie definitive generali di borsa', si: 'පොදු ශිෂ්‍යත්ව අවසාන ශ්‍රේණිගත කිරීම්' } },
  { id: 'd-sus-prov', inst: 'edisu', date: '2027-03-19', tags: ['rankings', 'scholarship'], applies: ['suspended'], cite: 'suspended', title: { en: 'Provisional ranking for "suspended" students', it: 'Graduatoria provvisoria per studenti "sospesi"', si: '"අත්හිටවූ" සිසුන් සඳහා තාවකාලික ශ්‍රේණිගත කිරීම' } },
  { id: 'd-sus-compl', inst: 'edisu', start: '2027-03-19', date: '2027-04-02', time: '12:00', tags: ['rankings', 'scholarship'], applies: ['suspended'], cite: 'suspended', title: { en: 'Complaints for "suspended" students', it: 'Reclami per studenti "sospesi"', si: '"අත්හිටවූ" සිසුන්ගේ පැමිණිලි' } },
  { id: 'd-sus-lodg', inst: 'edisu', start: '2027-03-19', date: '2027-04-09', time: '12:00', tags: ['accommodation', 'scholarship'], applies: ['suspended', 'fuori_sede'], cite: 'lodging', title: { en: 'Paid-lodging declaration (suspended students)', it: 'Dichiarazione alloggio oneroso (studenti sospesi)', si: 'ගෙවන නවාතැන් ප්‍රකාශය (අත්හිටවූ)' } },
  { id: 'd-sus-def', inst: 'edisu', date: '2027-04-30', tags: ['rankings', 'scholarship'], applies: ['suspended'], cite: 'suspended', title: { en: 'Definitive ranking for "suspended" students', it: 'Graduatoria definitiva per studenti "sospesi"', si: '"අත්හිටවූ" සිසුන් සඳහා අවසාන ශ්‍රේණිගත කිරීම' } },
  { id: 'd-1jun', inst: 'edisu', date: '2027-06-01', tags: ['scholarship'], applies: ['winners'], cite: 'exclusion', title: { en: 'Do not withdraw or move to a non-Piedmont university before this date', it: 'Non rinunciare agli studi né trasferirti fuori Piemonte prima di questa data', si: 'මෙම දිනට පෙර අධ්‍යයන අත්හැර නොදමන්න' } },
  { id: 'd-code', inst: 'edisu', date: '2027-06-30', tags: ['scholarship'], applies: ['international'], cite: 'tempCode', title: { en: 'Temporary Access Code 2026/27 expires', it: 'Scadenza del Codice Temporaneo d\'Accesso 2026/27', si: 'තාවකාලික ප්‍රවේශ කේතය කල් ඉකුත් වේ' } },
  { id: 'd-cfu', inst: 'edisu', date: '2027-08-10', tags: ['scholarship'], applies: ['first_year_bs', 'first_year_master'], cite: 'firstYearMerit', basis: 'summary', title: { en: 'CFU deadline for first-year students (20 CFU full-time, 11 part-time)', it: 'Scadenza CFU per i primi anni (20 CFU tempo pieno, 11 tempo parziale)', si: 'පළමු වසර සඳහා CFU අවසන් දිනය (පූර්ණ කාලීන 20, අර්ධ කාලීන 11)' } },
  { id: 'd-polito-tr', inst: 'polito', date: '2026-09-18', tags: ['enrollment'], applies: ['polito'], cite: 'politoArch', title: { en: 'Transfer request from another university (Architecture master\'s)', it: 'Richiesta di trasferimento da altro ateneo (LM Architettura)', si: 'වෙනත් විශ්වවිද්‍යාලයකින් මාරුවීම් ඉල්ලීම (ගෘහනිර්මාණ ශිල්පය)' } },
  { id: 'd-polito-e1', inst: 'polito', date: '2026-09-30', tags: ['enrollment'], applies: ['polito'], cite: 'politoArch', title: { en: 'Master\'s enrolment, 1st teaching period (Architecture, timetable 1)', it: 'Immatricolazione LM, 1° periodo didattico (Architettura, calendario 1)', si: 'මාස්ටර්ස් ලියාපදිංචිය (ගෘහනිර්මාණ ශිල්පය, කාලසටහන 1)' } },
  { id: 'd-polito-e2', inst: 'polito', date: '2026-11-02', tags: ['enrollment'], applies: ['polito'], cite: 'politoArch', title: { en: 'Master\'s enrolment (Architecture, timetable 2)', it: 'Immatricolazione LM (Architettura, calendario 2)', si: 'මාස්ටර්ස් ලියාපදිංචිය (ගෘහනිර්මාණ ශිල්පය, කාලසටහන 2)' } },
  { id: 'd-polito-id', inst: 'polito', date: '2026-12-03', tags: ['enrollment'], applies: ['polito'], cite: 'politoArch', title: { en: 'Identity recognition for students from other universities (Architecture master\'s)', it: 'Riconoscimento identità per studenti di altri atenei (LM Architettura)', si: 'අනන්‍යතා සත්‍යාපනය (වෙනත් විශ්වවිද්‍යාල)' } },
];

export const APPLIES_LABEL = {
  all: { en: 'All applicants', it: 'Tutti i richiedenti', si: 'සියලුම අයදුම්කරුවන්' },
  first_year_bs: { en: 'First-year bachelor / single-cycle', it: 'Primo anno laurea / ciclo unico', si: 'පළමු වසර උපාධි' },
  first_year_master: { en: 'First-year master\'s', it: 'Primo anno magistrale', si: 'පළමු වසර මාස්ටර්ස්' },
  later: { en: 'Later years', it: 'Anni successivi', si: 'පසු වසර' },
  accommodation: { en: 'Accommodation applicants', it: 'Richiedenti posto letto', si: 'නවාතැන් අයදුම්කරුවන්' },
  fuori_sede: { en: 'Non-resident (fuori sede)', it: 'Fuori sede', si: 'පදිංචි නොවන (fuori sede)' },
  suspended: { en: 'Students "sospesi"', it: 'Studenti "sospesi"', si: '"අත්හිටවූ" සිසුන්' },
  international: { en: 'International students', it: 'Studenti internazionali', si: 'ජාත්‍යන්තර සිසුන්' },
  winners: { en: 'Scholarship winners', it: 'Vincitori di borsa', si: 'ශිෂ්‍යත්ව ජයග්‍රාහකයින්' },
  polito: { en: 'PoliTO master\'s applicants', it: 'Candidati LM PoliTO', si: 'PoliTO මාස්ටර්ස් අයදුම්කරුවන්' },
};

// Deterministic rules (versioned per academic year; changes go through admin review)
export const RULES = [
  { id: 'r-isee-max', inst: 'edisu', ay: '2026/27', type: 'economic', category: 'all', key: 'isee_max', value: 26306.25, unit: 'EUR', cite: 'isee', status: 'published' },
  { id: 'r-ispe-max', inst: 'edisu', ay: '2026/27', type: 'economic', category: 'all', key: 'ispe_max', value: 57187.53, unit: 'EUR', cite: 'isee', status: 'published' },
  { id: 'r-cfu-first-ft', inst: 'edisu', ay: '2026/27', type: 'merit', category: 'first_year', mode: 'full_time', key: 'cfu_required', value: 20, unit: 'CFU', deadline: '2027-08-10', cite: 'firstYearMerit', status: 'published' },
  { id: 'r-cfu-first-pt', inst: 'edisu', ay: '2026/27', type: 'merit', category: 'first_year', mode: 'part_time', key: 'cfu_required', value: 11, unit: 'CFU', deadline: '2027-08-10', cite: 'firstYearMerit', status: 'published' },
  { id: 'r-cfu-later', inst: 'edisu', ay: '2026/27', type: 'merit', category: 'later_years', key: 'cfu_required', value: null, unit: 'CFU', deadline: '2026-08-10', cite: 'laterMerit', status: 'needs_indexing' },
  { id: 'r-indep-income', inst: 'edisu', ay: '2026/27', type: 'economic', category: 'independent', key: 'min_income_2024_2025', value: 9000, unit: 'EUR', cite: 'indep', status: 'published' },
  { id: 'r-commute-min', inst: 'edisu', ay: '2026/27', type: 'residence', category: 'all', key: 'commuter_max_minutes', value: 60, unit: 'min', cite: 'studentType', status: 'published' },
  { id: 'r-residence-date', inst: 'edisu', ay: '2026/27', type: 'residence', category: 'all', key: 'residence_reference_date', value: '2026-11-12', unit: 'date', cite: 'studentType', status: 'published' },
  { id: 'r-income-year-euit', inst: 'edisu', ay: '2026/27', type: 'economic', category: 'italian_eu', key: 'parificato_income_year', value: 2024, unit: 'year', cite: 'parificatoIt', status: 'published' },
  { id: 'r-income-year-extra', inst: 'edisu', ay: '2026/27', type: 'economic', category: 'extra_eu', key: 'parificato_income_year', value: 2025, unit: 'year', cite: 'incomeYear', status: 'published' },
];

export const GLOSSARY = [
  { it: 'Sospeso', en: 'Suspended', si: 'අත්හිටවූ', def: { en: 'A ranking outcome in the 16 December 2026 list: your case is re-evaluated in the March–April 2027 rankings.', it: 'Un esito della graduatoria del 16 dicembre 2026: il tuo caso viene rivalutato nelle graduatorie di marzo–aprile 2027.' }, ask: 'What does suspended mean?' },
  { it: 'Borsa di studio', en: 'Scholarship', si: 'ශිෂ්‍යත්වය', def: { en: 'Money granted by EDISU on financial and merit requirements; amount depends on student type and ISEE.', it: 'Somma assegnata da EDISU in base a requisiti economici e di merito; l\'importo dipende dalla tipologia di studente e dall\'ISEE.' }, ask: 'Am I eligible for the scholarship?' },
  { it: 'ISEE Universitario', en: 'University ISEE', si: 'විශ්වවිද්‍යාල ISEE', def: { en: 'Family-income indicator for university benefits (must include quadro C). Limit for 2026/27: €26,306.25.', it: 'Indicatore economico per le prestazioni universitarie (con quadro C). Limite 2026/27: € 26.306,25.' }, ask: 'What is the ISEE limit?' },
  { it: 'ISEE Parificato', en: 'Equalised ISEE', si: 'ISEE Parificato', def: { en: 'ISEE calculated by EDISU from consular documents when family income or assets are abroad.', it: 'ISEE calcolato da EDISU sulla base della documentazione consolare quando redditi o patrimoni della famiglia sono all\'estero.' }, ask: 'How does ISEE Parificato work?' },
  { it: 'ISPE', en: 'Assets indicator', si: 'වත්කම් දර්ශකය', def: { en: 'Equivalent assets indicator; the limit is €57,187.53.', it: 'Indicatore della situazione patrimoniale equivalente; il limite è € 57.187,53.' }, ask: 'What is the ISEE limit?' },
  { it: 'Fuori sede', en: 'Non-resident student', si: 'පදිංචි නොවන සිසුවා', def: { en: 'Lives where the course is not reachable by public transport in 60 minutes; gets the higher amount with a paid-lodging declaration or EDISU bed.', it: 'Risiede dove il corso non è raggiungibile in 60 minuti coi mezzi pubblici; ottiene l\'importo maggiore con dichiarazione di alloggio oneroso o posto letto EDISU.' }, ask: 'What is my accommodation status?' },
  { it: 'Pendolare', en: 'Commuter', si: 'ප්‍රවාහන සිසුවා', def: { en: 'Lives elsewhere but can reach the course in 60 minutes by public transport.', it: 'Risiede altrove ma raggiunge il corso in 60 minuti con i mezzi pubblici.' }, ask: 'What is my accommodation status?' },
  { it: 'Vincitore / Idoneo / Escluso', en: 'Winner / Eligible / Excluded', si: 'ජයග්‍රාහකයා / සුදුසුකම් ලත් / බැහැර කළ', def: { en: 'Winner gets the benefit; idoneo meets requirements but gets it only if funds/beds exist; escluso misses a requirement.', it: 'Vincitore ottiene il beneficio; idoneo ha i requisiti ma lo ottiene solo se ci sono fondi/posti; escluso non ha un requisito.' }, ask: 'Explain my scholarship ranking' },
  { it: 'Reclamo', en: 'Complaint (against a provisional ranking)', si: 'පැමිණිල්ල', def: { en: 'The formal way to correct data on a provisional ranking, within its deadline.', it: 'Lo strumento formale per correggere i dati di una graduatoria provvisoria, entro la scadenza.' }, ask: 'When are the rankings?' },
  { it: 'Dichiarazione di alloggio a titolo oneroso', en: 'Paid-lodging declaration', si: 'ගෙවන නවාතැන් ප්‍රකාශය', def: { en: 'Declaration that you pay for housing; needed for the non-resident amount when you have no EDISU bed.', it: 'Dichiarazione di sostenere spese di alloggio; necessaria per l\'importo da fuori sede se non hai un posto letto EDISU.' }, ask: 'What is my accommodation status?' },
  { it: 'CFU', en: 'University credits (ECTS)', si: 'විශ්වවිද්‍යාල ණය ඒකක', def: { en: 'Credits you earn by passing exams; scholarship merit rules count them.', it: 'Crediti ottenuti superando gli esami; i requisiti di merito della borsa li contano.' }, ask: 'What CFU do I need?' },
  { it: 'Documentazione consolare', en: 'Consular documents', si: 'කොන්සියුලර් ලේඛන', def: { en: 'Translated and legalised documents on family composition, income and assets abroad.', it: 'Documenti tradotti e legalizzati su composizione del nucleo, redditi e patrimoni all\'estero.' }, ask: 'What documents do I need?' },
  { it: 'Codice Temporaneo d\'Accesso', en: 'Temporary Access Code', si: 'තාවකාලික ප්‍රවේශ කේතය', def: { en: 'Login for international students without SPID; valid until 30 June 2027.', it: 'Accesso per studenti internazionali senza SPID; valido fino al 30 giugno 2027.' }, ask: 'Help for international students' },
  { it: 'Semestre filtro', en: 'Filter semester', si: 'පෙරහන් සමාරම්භය', def: { en: 'First semester for Medicine, Dentistry and Veterinary courses; the bando has special rules for these students.', it: 'Primo semestre dei corsi di Medicina, Odontoiatria e Veterinaria; il bando ha regole specifiche.' }, ask: 'What documents do I need?' },
];

export const UPDATES = [
  { id: 'u-bando', date: '2026-07-22', inst: 'edisu', ay: '2026/27', applies: ['all'], cite: 'regione', title: { en: 'EDISU published the 2026/27 bando', it: 'EDISU ha pubblicato il bando 2026/27', si: 'EDISU 2026/27 ඇමතුම් නිවේදනය ප්‍රකාශයට පත් කළා' }, body: { en: 'Applications for degree, master\'s and single-cycle students ran 22 July–4 September 2026.', it: 'Domande per laurea, magistrale e ciclo unico dal 22 luglio al 4 settembre 2026.', si: 'අයදුම්පත් ජූලි 22 – සැප්තැම්බර් 4, 2026.' } },
  { id: 'u-parttime', date: '2026-07-22', inst: 'edisu', ay: '2026/27', applies: ['all'], cite: 'novelties', title: { en: 'New: extra semester for part-time students', it: 'Novità: semestre in più per gli iscritti part-time', si: 'නව: අර්ධ කාලීන සිසුන් සඳහා අමතර සමාරම්භයක්' }, body: { en: 'The scholarship can now cover the additional semester for part-time enrolments too.', it: 'La borsa può ora coprire l\'ulteriore semestre anche per gli iscritti part-time.', si: 'ශිෂ්‍යත්වය දැන් අර්ධ කාලීන ලියාපදිංචි සඳහාද අමතර සමාරම්භයට ලැබේ.' } },
  { id: 'u-visa', date: '2026-07-22', inst: 'edisu', ay: '2026/27', applies: ['international'], cite: 'novelties', title: { en: 'New: attach visa D if you needed one to enrol', it: 'Novità: allega il visto D se ti serviva per immatricolarti', si: 'නව: ලියාපදිංචියට වීසා D අවශ්‍ය නම් අමුණන්න' }, body: { en: 'International students who needed an entry visa must attach visa D to the application or by the Art. 31 deadlines.', it: 'Gli studenti internazionali che avevano bisogno del visto d\'ingresso devono allegare il visto D alla domanda o entro le scadenze dell\'art. 31.', si: 'ජාත්‍යන්තර සිසුන් වීසා D අමුණන්න.' } },
  { id: 'u-polito', date: '2026-04-10', inst: 'polito', ay: '2026/27', applies: ['polito'], cite: 'politoReg', title: { en: 'PoliTO enrolment regulation 2026/27 published', it: 'Pubblicato il Regolamento di immatricolazione PoliTO 2026/27', si: 'PoliTO ලියාපදිංචි රෙගුලාසි 2026/27' }, body: { en: 'D.R. 382/2026 of 10 April 2026 sets procedures and deadlines for enrolment.', it: 'Il D.R. 382/2026 del 10 aprile 2026 stabilisce procedure e scadenze di immatricolazione.', si: 'D.R. 382/2026 (අප්‍රේල් 10, 2026).' } },
];

// Clearly fictional test personas (DEMO). Not real people.
export const PERSONAS = [
  { id: 'p1', name: 'Amara (demo)', desc: { en: 'First-year international master\'s student', it: 'Studentessa internazionale, primo anno magistrale', si: 'පළමු වසර ජාත්‍යන්තර මාස්ටර්ස් සිසුවිය' },
    profile: { demo: true, name: 'Amara (demo)', university: 'polito', degreeType: 'master', yearBucket: 'first', partTime: false, cfu: 14, citizenship: 'extra_eu', familyLocation: 'abroad', residenceType: 'fuori_sede', accommodationRequested: true, accommodationStatus: 'idoneo', scholarshipApplied: true, rankingStatus: 'unknown', lang: 'en' } },
  { id: 'p2', name: 'Luca (demo)', desc: { en: 'Bachelor\'s student, later year', it: 'Studente triennale, anno successivo', si: 'උපාධි සිසුවා, පසු වසර' },
    profile: { demo: true, name: 'Luca (demo)', university: 'polito', degreeType: 'bachelor', yearBucket: 'later', partTime: false, cfu: 96, citizenship: 'it', familyLocation: 'italy', residenceType: 'pendolare', accommodationRequested: false, accommodationStatus: 'not_applied', scholarshipApplied: true, iseeValue: 19850, ispeValue: 24000, lang: 'it' } },
  { id: 'p3', name: 'Nimal (demo)', desc: { en: 'Foreign family income (Sri Lanka)', it: 'Reddito familiare estero (Sri Lanka)', si: 'විදේශීය පවුල් ආදායම (ශ්‍රී ලංකාව)' },
    profile: { demo: true, name: 'Nimal (demo)', university: 'polito', degreeType: 'bachelor', yearBucket: 'first', partTime: false, cfu: 6, citizenship: 'extra_eu', familyLocation: 'abroad', residenceType: 'fuori_sede', accommodationRequested: true, accommodationStatus: 'winner', scholarshipApplied: true, lang: 'si' } },
  { id: 'p4', name: 'Giulia (demo)', desc: { en: 'Accommodation applicant', it: 'Richiedente posto letto', si: 'නවාතැන් අයදුම්කරු' },
    profile: { demo: true, name: 'Giulia (demo)', university: 'polito', degreeType: 'master', yearBucket: 'later', partTime: false, cfu: 60, citizenship: 'it', familyLocation: 'italy', residenceType: 'fuori_sede', accommodationRequested: true, accommodationStatus: 'winner', scholarshipApplied: true, iseeValue: 14200, ispeValue: 12000, lang: 'en' } },
  { id: 'p5', name: 'Marco (demo)', desc: { en: 'Missing CFU, ranking "suspended"', it: 'CFU mancanti, graduatoria "sospeso"', si: 'CFU අඩුයි, "අත්හිටවූ"' },
    profile: { demo: true, name: 'Marco (demo)', university: 'polito', degreeType: 'master', yearBucket: 'first', partTime: false, cfu: 9, citizenship: 'eu', familyLocation: 'abroad', residenceType: 'fuori_sede', accommodationRequested: false, accommodationStatus: 'not_applied', scholarshipApplied: true, rankingStatus: 'suspended', lang: 'it' } },
];
