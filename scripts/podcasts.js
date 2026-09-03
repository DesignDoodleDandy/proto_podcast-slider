// Beispiel-Podcast-Daten für den HMG Nutzertest-Prototypen.
// Zwei Cover stammen aus dem Figma-Design (Catching Chris, Morning Briefing);
// die restlichen acht Kacheln werden mit einem generierten Gradient-SVG als
// Cover-Fallback gerendert (siehe generateCoverSvg in slider.js).
export const PODCASTS = [
  {
    title: "Folge 7: Wer ist hier das Mastermind?",
    show: "Catching Chris",
    cover: "assets/covers/catching-chris.png",
    isPlus: true,
  },
  {
    title: "Deutschlands Zukunft, Bildung, Mindsetkrise – was Hörer bewegt",
    show: "Morning Briefing",
    cover: "assets/covers/morning-briefing.png",
    isPlus: false,
  },
  {
    title: "Handelsblatt Today: Warum der DAX in Rekordlaune bleibt",
    show: "Handelsblatt Today",
    cover: null,
    palette: ["#004b6b", "#0090c9"],
    isPlus: true,
  },
  {
    title: "Chefgespräch: Wie KI die deutsche Industrie verändert",
    show: "Chefgespräch",
    cover: null,
    palette: ["#111111", "#3a3a3a"],
    isPlus: false,
  },
  {
    title: "WiWo Coach: Verhandeln – die 5 wichtigsten Sätze",
    show: "WiWo Coach",
    cover: null,
    palette: ["#ef7c00", "#ffb066"],
    isPlus: true,
  },
  {
    title: "Finance Friday: Zinswende, Dividendenperlen, Depot-Check",
    show: "Finance Friday",
    cover: null,
    palette: ["#0f6b4a", "#39a97e"],
    isPlus: false,
  },
  {
    title: "Rethinking Retail: Was Kunden 2026 wirklich wollen",
    show: "Rethinking Retail",
    cover: null,
    palette: ["#7d1128", "#c73e5a"],
    isPlus: false,
  },
  {
    title: "Tech Briefing: Die nächste Welle der Cloud-Konsolidierung",
    show: "Tech Briefing",
    cover: null,
    palette: ["#1a1a5a", "#5560d4"],
    isPlus: false,
  },
  {
    title: "Green Deals: Wo grüne Investments jetzt Rendite bringen",
    show: "Green Deals",
    cover: null,
    palette: ["#264d1f", "#5aa04e"],
    isPlus: true,
  },
  {
    title: "Chef*innen-Sache: Führen ohne Bullshit – ein Manifest",
    show: "Chef*innen-Sache",
    cover: null,
    palette: ["#4a1d5b", "#8f4bb2"],
    isPlus: false,
  },
];

/** Extended 20-podcast dataset for the "windowed dots" variant that
 *  demonstrates how the indicator scales when there are noticeably more
 *  tiles than the standard dots row can show. */
export const PODCASTS_20 = [
  ...PODCASTS,
  {
    title: "Zukunftskonferenz: Wo Deutschland 2030 im Rennen liegt",
    show: "Zukunftskonferenz",
    cover: null,
    palette: ["#132a4a", "#3a68a8"],
    isPlus: false,
  },
  {
    title: "Family Office: Wie Milliardäre ihre Vermögen sortieren",
    show: "Family Office",
    cover: null,
    palette: ["#3b2b1f", "#a67c52"],
    isPlus: true,
  },
  {
    title: "Startup-Crashkurs: Bewerten, Beteiligen, Buyout",
    show: "Startup-Crashkurs",
    cover: null,
    palette: ["#0e5b48", "#4bc79f"],
    isPlus: false,
  },
  {
    title: "Kapital & Klasse: Sozialaktien, ETFs, Nachhaltigkeit",
    show: "Kapital & Klasse",
    cover: null,
    palette: ["#4a1e2b", "#c05875"],
    isPlus: false,
  },
  {
    title: "Ceo-Talk: Wer führt DAX40 durch die Rezession?",
    show: "CEO-Talk",
    cover: null,
    palette: ["#111427", "#4b527e"],
    isPlus: true,
  },
  {
    title: "Deep Dive Immobilien: Metropolen, Mieten, Momentum",
    show: "Deep Dive Immo",
    cover: null,
    palette: ["#2f4732", "#79a677"],
    isPlus: false,
  },
  {
    title: "Zoll & Zoff: Global Trade nach der US-Wahl",
    show: "Zoll & Zoff",
    cover: null,
    palette: ["#5a2e13", "#c07a3d"],
    isPlus: false,
  },
  {
    title: "Autobranche im Umbruch: Batterie, Bytes, Bilanzen",
    show: "Autobranche",
    cover: null,
    palette: ["#111", "#666"],
    isPlus: true,
  },
  {
    title: "Krypto Klartext: Bitcoin, Regulierung, Real World Assets",
    show: "Krypto Klartext",
    cover: null,
    palette: ["#3d2f0d", "#c59a3a"],
    isPlus: false,
  },
  {
    title: "Boardroom Beats: Corporate Governance im Wandel",
    show: "Boardroom Beats",
    cover: null,
    palette: ["#26192d", "#7f5f95"],
    isPlus: false,
  },
];
