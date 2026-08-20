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
