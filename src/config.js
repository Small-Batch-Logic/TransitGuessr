export const SITE_URL = window.location.origin === 'null' ? 'https://transitguessr.app' : window.location.origin;

export const CITY_REGIONS = {
  // North America
  Toronto: 'North America', Vaughan: 'North America', Burnaby: 'North America',
  Surrey: 'North America', Vancouver: 'North America', Montreal: 'North America',
  'Montréal': 'North America', 'New York': 'North America', Brooklyn: 'North America',
  Boston: 'North America', Philadelphia: 'North America', Baltimore: 'North America',
  Chicago: 'North America', Minneapolis: 'North America', Atlanta: 'North America',
  Dallas: 'North America', 'San Francisco': 'North America', 'Los Angeles': 'North America',
  'San Diego': 'North America', Phoenix: 'North America', Portland: 'North America',
  Seattle: 'North America', Denver: 'North America', Sacramento: 'North America',
  'Salt Lake City': 'North America', Cleveland: 'North America', Miami: 'North America',
  Houston: 'North America',
  // Europe
  London: 'Europe', Manchester: 'Europe', Edinburgh: 'Europe', Glasgow: 'Europe',
  Paris: 'Europe', Berlin: 'Europe', Newcastle: 'Europe', Birmingham: 'Europe',
  Sheffield: 'Europe', Nottingham: 'Europe', Liverpool: 'Europe',
  // Asia-Pacific
  Tokyo: 'Asia-Pacific', Sydney: 'Asia-Pacific',
};

export const STATION_NAME_REVEAL_SCORE = 4500;

export const MODES = {
  worldwide: {
    name: 'Worldwide',
    city: 'Global',
    desc: 'Test your knowledge across major transit systems globally.',
    filter: () => true,
    color: 'var(--world)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`
  },
  daily: {
    name: 'Daily Challenge',
    city: 'Global',
    desc: 'The same 5 stations for everyone in the world. New challenge every day.',
    filter: () => true,
    color: 'var(--daily)',
    icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>`
  },
  toronto: {
    name: 'Toronto',
    city: 'Toronto',
    desc: 'Master the red and white: All Line 1, 2, and 4 stations in the GTHA.',
    filter: s => ['Toronto', 'Vaughan'].includes(s.city),
    color: 'var(--ttc)',
    icon: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M7 9h10M12 9v7" stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none"/></svg>`,
    graphic: `<svg viewBox="0 0 280 140" xmlns="http://www.w3.org/2000/svg"><rect width="280" height="140" fill="#9B0000"/><ellipse cx="140" cy="80" rx="160" ry="100" fill="#DA291C" opacity="0.45"/><rect x="138.5" y="6" width="3" height="20" fill="white" opacity="0.9"/><polygon points="137,26 138.5,26 141.5,62 137,62" fill="white" opacity="0.85"/><polygon points="141.5,26 143,26 141.5,62 143,62" fill="white" opacity="0.85"/><rect x="124" y="58" width="32" height="10" rx="3" fill="white" opacity="0.8"/><rect x="134" y="68" width="12" height="40" fill="white" opacity="0.85"/><polygon points="112,114 134,70 146,70 168,114" fill="white" opacity="0.65"/><rect x="0" y="122" width="280" height="18" fill="rgba(0,0,0,0.35)"/><rect x="8" y="90" width="20" height="32" fill="rgba(0,0,0,0.28)"/><rect x="32" y="80" width="16" height="42" fill="rgba(0,0,0,0.28)"/><rect x="216" y="84" width="18" height="38" fill="rgba(0,0,0,0.28)"/><rect x="238" y="74" width="16" height="48" fill="rgba(0,0,0,0.28)"/><rect x="258" y="90" width="18" height="32" fill="rgba(0,0,0,0.28)"/></svg>`
  },
  montreal: {
    name: 'Montréal',
    city: 'Montréal',
    desc: 'Navigating the STM: Every station in the Montréal Metro system.',
    filter: s => s.city === 'Montréal',
    color: 'var(--stm)',
    icon: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M8 9l4 4 4-4" stroke="white" stroke-width="3" fill="none"/></svg>`,
    graphic: `<svg viewBox="0 0 280 140" xmlns="http://www.w3.org/2000/svg"><rect width="280" height="140" fill="#003DA5"/><ellipse cx="140" cy="110" rx="100" ry="40" fill="#002D7A" opacity="0.6"/><path d="M60 110 Q140 40 220 110" fill="none" stroke="#F57C00" stroke-width="3" opacity="0.7"/><path d="M80 110 Q140 55 200 110" fill="none" stroke="#F57C00" stroke-width="2" opacity="0.5"/><path d="M100 110 Q140 68 180 110" fill="none" stroke="#F57C00" stroke-width="1.5" opacity="0.4"/><rect x="130" y="40" width="20" height="70" fill="#F57C00" opacity="0.15"/><line x1="140" y1="10" x2="190" y2="80" stroke="#F57C00" stroke-width="4" opacity="0.75"/><circle cx="190" cy="80" r="6" fill="#F57C00" opacity="0.6"/><rect x="0" y="122" width="280" height="18" fill="rgba(0,0,0,0.3)"/></svg>`
  },
  vancouver: {
    name: 'Vancouver',
    city: 'Vancouver',
    desc: 'The SkyTrain network: All Expo, Millennium, and Canada Line stations.',
    filter: s => ['Vancouver', 'Burnaby', 'Surrey'].includes(s.city),
    color: 'var(--skytrain)',
    icon: `<svg viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="currentColor"/><path d="M12 6v12M7 9h10" stroke="white" stroke-width="3"/></svg>`,
    graphic: `<svg viewBox="0 0 280 140" xmlns="http://www.w3.org/2000/svg"><rect width="280" height="140" fill="#00387A"/><polygon points="30,80 60,30 90,80" fill="white" opacity="0.12"/><polygon points="70,80 110,20 150,80" fill="white" opacity="0.1"/><polygon points="130,80 165,35 200,80" fill="white" opacity="0.12"/><polygon points="180,80 210,42 240,80" fill="white" opacity="0.1"/><rect x="0" y="85" width="280" height="8" fill="#0050A0" opacity="0.8"/><rect x="0" y="82" width="280" height="4" fill="white" opacity="0.15"/><rect x="20" y="60" width="55" height="22" rx="4" fill="white" opacity="0.15"/><rect x="28" y="65" width="12" height="10" rx="1" fill="rgba(255,220,100,0.5)"/><rect x="44" y="65" width="12" height="10" rx="1" fill="rgba(255,220,100,0.5)"/><rect x="60" y="65" width="10" height="10" rx="1" fill="rgba(255,220,100,0.4)"/><rect x="0" y="122" width="280" height="18" fill="rgba(0,0,0,0.3)"/></svg>`
  },
  nyc: {
    name: 'New York',
    city: 'New York',
    desc: 'The city that never sleeps: Iconic entrances across all five boroughs.',
    filter: s => ['New York', 'Brooklyn'].includes(s.city),
    color: 'var(--nyc)',
    icon: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M9 15.5c0-2 1.5-3.5 3-3.5s3 1.5 3 3.5m-3-7V12" stroke="white" stroke-width="2.5" fill="none"/></svg>`,
    graphic: `<svg viewBox="0 0 280 140" xmlns="http://www.w3.org/2000/svg"><rect width="280" height="140" fill="#0D1B2A"/><circle cx="22" cy="12" r="1" fill="white" opacity="0.5"/><circle cx="58" cy="7" r="0.8" fill="white" opacity="0.4"/><circle cx="160" cy="16" r="1" fill="white" opacity="0.5"/><circle cx="220" cy="9" r="0.8" fill="white" opacity="0.4"/><circle cx="265" cy="20" r="1" fill="white" opacity="0.5"/><rect x="5" y="78" width="18" height="42" fill="#B08020" opacity="0.7"/><rect x="26" y="62" width="16" height="58" fill="#C89830" opacity="0.75"/><rect x="45" y="70" width="14" height="50" fill="#A07018" opacity="0.7"/><rect x="62" y="52" width="18" height="68" fill="#C08828" opacity="0.8"/><rect x="83" y="30" width="14" height="90" fill="#D4A520" opacity="0.9"/><polygon points="90,18 86,32 94,32" fill="#D4A520" opacity="0.9"/><rect x="88" y="14" width="4" height="6" fill="#D4A520"/><rect x="85" y="42" width="3" height="3" fill="#FFE566" opacity="0.7"/><rect x="91" y="42" width="3" height="3" fill="#FFE566" opacity="0.7"/><rect x="85" y="52" width="3" height="3" fill="#FFE566" opacity="0.5"/><rect x="91" y="58" width="3" height="3" fill="#FFE566" opacity="0.7"/><rect x="100" y="60" width="16" height="60" fill="#B07820" opacity="0.75"/><rect x="119" y="55" width="18" height="65" fill="#C08828" opacity="0.8"/><rect x="141" y="48" width="20" height="72" fill="#B8921E" opacity="0.8"/><rect x="164" y="58" width="15" height="62" fill="#A07018" opacity="0.75"/><rect x="182" y="50" width="18" height="70" fill="#C08828" opacity="0.8"/><rect x="203" y="65" width="16" height="55" fill="#B07820" opacity="0.75"/><rect x="222" y="58" width="14" height="62" fill="#C08828" opacity="0.8"/><rect x="239" y="70" width="16" height="50" fill="#A07018" opacity="0.7"/><rect x="258" y="62" width="22" height="58" fill="#B08020" opacity="0.75"/><rect x="0" y="118" width="280" height="22" fill="rgba(8,18,32,0.95)"/><rect x="88" y="120" width="3" height="5" fill="#D4A520" opacity="0.2"/></svg>`
  },
  london: {
    name: 'London',
    city: 'London',
    desc: 'Mind the Gap: Stations across the Underground and DLR networks.',
    filter: s => s.city === 'London',
    color: 'var(--tube)',
    icon: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" fill="currentColor"/><rect x="2" y="10" width="20" height="4" fill="white" rx="1"/></svg>`,
    graphic: `<svg viewBox="0 0 280 140" xmlns="http://www.w3.org/2000/svg"><rect width="280" height="140" fill="#1A0808"/><ellipse cx="140" cy="80" rx="180" ry="100" fill="#E32017" opacity="0.2"/><rect x="124" y="88" width="32" height="32" fill="#E32017" opacity="0.65"/><rect x="126" y="58" width="28" height="32" fill="#E32017" opacity="0.7"/><circle cx="140" cy="74" r="11" fill="rgba(255,255,255,0.12)" stroke="#E32017" stroke-width="2" opacity="0.8"/><rect x="128" y="42" width="24" height="18" fill="#E32017" opacity="0.75"/><polygon points="140,26 131,44 149,44" fill="#E32017" opacity="0.85"/><rect x="138" y="16" width="4" height="12" fill="#E32017" opacity="0.9"/><rect x="0" y="120" width="280" height="20" fill="rgba(0,0,0,0.45)"/><rect x="18" y="94" width="16" height="26" fill="rgba(227,32,23,0.25)"/><rect x="38" y="86" width="18" height="34" fill="rgba(227,32,23,0.2)"/><rect x="200" y="90" width="16" height="30" fill="rgba(227,32,23,0.25)"/><rect x="220" y="82" width="18" height="38" fill="rgba(227,32,23,0.2)"/><rect x="242" y="92" width="16" height="28" fill="rgba(227,32,23,0.22)"/></svg>`
  },
  paris: {
    name: 'Paris',
    city: 'Paris',
    desc: 'Le Métro: Art Nouveau entrances and urban landmarks of Paris.',
    filter: s => s.city === 'Paris',
    color: 'var(--ratp)',
    icon: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M7 16V8l5 5 5-5v8" stroke="white" stroke-width="2.5" fill="none"/></svg>`,
    graphic: `<svg viewBox="0 0 280 140" xmlns="http://www.w3.org/2000/svg"><rect width="280" height="140" fill="#1A1A2E"/><ellipse cx="140" cy="100" rx="160" ry="80" fill="#0066CC" opacity="0.15"/><polygon points="140,10 148,90 132,90" fill="white" opacity="0.7"/><rect x="125" y="88" width="30" height="6" rx="1" fill="white" opacity="0.65"/><rect x="130" y="94" width="20" height="4" rx="1" fill="white" opacity="0.55"/><polygon points="140,88 126,88 124,100 156,100 154,88" fill="white" opacity="0.5"/><polygon points="140,98 108,98 106,115 174,115 172,98" fill="white" opacity="0.4"/><rect x="0" y="122" width="280" height="18" fill="rgba(0,0,0,0.4)"/><rect x="20" y="96" width="14" height="26" fill="rgba(0,80,180,0.25)"/><rect x="236" y="94" width="16" height="28" fill="rgba(0,80,180,0.25)"/><circle cx="45" cy="16" r="1.5" fill="white" opacity="0.4"/><circle cx="230" cy="20" r="1" fill="white" opacity="0.4"/><circle cx="190" cy="10" r="1.2" fill="white" opacity="0.4"/></svg>`
  },
  tokyo: {
    name: 'Tokyo',
    city: 'Tokyo',
    desc: 'Tokyo Metro optimization: High-density rail across the megalopolis.',
    filter: s => s.city === 'Tokyo',
    color: 'var(--tokyo)',
    icon: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M7 15V9l5 4 5-4v6" stroke="white" stroke-width="2.5" fill="none"/></svg>`,
    graphic: `<svg viewBox="0 0 280 140" xmlns="http://www.w3.org/2000/svg"><rect width="280" height="140" fill="#1A0D0D"/><ellipse cx="140" cy="80" rx="180" ry="100" fill="#CC0033" opacity="0.18"/><rect x="137" y="6" width="6" height="26" fill="white" opacity="0.85"/><ellipse cx="140" cy="38" rx="28" ry="10" fill="white" opacity="0.7"/><rect x="130" y="34" width="20" height="55" fill="white" opacity="0.7"/><polygon points="110,92 130,36 150,36 170,92" fill="white" opacity="0.55"/><polygon points="95,115 110,93 170,93 185,115" fill="white" opacity="0.4"/><rect x="0" y="122" width="280" height="18" fill="rgba(0,0,0,0.4)"/><rect x="20" y="90" width="16" height="32" fill="rgba(180,0,40,0.2)"/><rect x="40" y="82" width="14" height="40" fill="rgba(180,0,40,0.2)"/><rect x="210" y="86" width="16" height="36" fill="rgba(180,0,40,0.2)"/><rect x="230" y="78" width="14" height="44" fill="rgba(180,0,40,0.2)"/><rect x="248" y="90" width="18" height="32" fill="rgba(180,0,40,0.2)"/></svg>`
  },
  chicago: {
    name: 'Chicago',
    city: 'Chicago',
    desc: 'The "L": Elevated lines and subterranean stations in the Windy City.',
    filter: s => s.city === 'Chicago',
    color: 'var(--cta)',
    icon: `<svg viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="10" rx="3" fill="currentColor"/><path d="M8 16V9M8 16h5" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>`,
    graphic: `<svg viewBox="0 0 280 140" xmlns="http://www.w3.org/2000/svg"><rect width="280" height="140" fill="#0A0A0A"/><rect x="16" y="28" width="18" height="90" fill="rgba(255,255,255,0.06)"/><rect x="38" y="18" width="16" height="100" fill="rgba(255,255,255,0.05)"/><rect x="80" y="22" width="20" height="96" fill="rgba(255,255,255,0.06)"/><rect x="168" y="16" width="22" height="102" fill="rgba(255,255,255,0.06)"/><rect x="194" y="24" width="16" height="94" fill="rgba(255,255,255,0.05)"/><rect x="238" y="20" width="20" height="98" fill="rgba(255,255,255,0.05)"/><rect x="0" y="74" width="280" height="10" fill="#C41929" opacity="0.85"/><rect x="0" y="72" width="280" height="3" fill="rgba(255,255,255,0.18)"/><rect x="0" y="82" width="280" height="3" fill="rgba(0,0,0,0.4)"/><rect x="28" y="74" width="3" height="46" fill="#333" opacity="0.9"/><rect x="90" y="74" width="3" height="46" fill="#333" opacity="0.9"/><rect x="152" y="74" width="3" height="46" fill="#333" opacity="0.9"/><rect x="214" y="74" width="3" height="46" fill="#333" opacity="0.9"/><rect x="4" y="50" width="38" height="22" rx="3" fill="#C41929" opacity="0.9"/><rect x="10" y="55" width="8" height="10" rx="1" fill="rgba(255,220,80,0.7)"/><rect x="22" y="55" width="8" height="10" rx="1" fill="rgba(255,220,80,0.7)"/><rect x="34" y="55" width="6" height="10" rx="1" fill="rgba(255,220,80,0.5)"/><rect x="0" y="122" width="280" height="18" fill="rgba(0,0,0,0.5)"/></svg>`
  },
  berlin: {
    name: 'Berlin',
    city: 'Berlin',
    desc: 'U-Bahn History: Navigate the iconic yellow trains and brutalist architecture.',
    filter: s => s.city === 'Berlin',
    color: 'var(--ubahn)',
    icon: `<svg viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="currentColor"/><path d="M9 8v5a3 3 0 0 0 6 0V8" stroke="white" stroke-width="2.5" stroke-linecap="round" fill="none"/></svg>`,
    graphic: `<svg viewBox="0 0 280 140" xmlns="http://www.w3.org/2000/svg"><rect width="280" height="140" fill="#001A40"/><rect x="137" y="6" width="6" height="28" fill="white" opacity="0.8"/><circle cx="140" cy="52" r="22" fill="#003591" opacity="0.95"/><circle cx="140" cy="52" r="22" fill="none" stroke="white" stroke-width="2" opacity="0.55"/><rect x="134" y="74" width="12" height="48" fill="white" opacity="0.65"/><polygon points="118,124 134,76 146,76 162,124" fill="white" opacity="0.45"/><rect x="0" y="122" width="280" height="18" fill="rgba(0,0,0,0.35)"/><rect x="18" y="86" width="18" height="36" fill="rgba(0,53,145,0.3)"/><rect x="40" y="78" width="14" height="44" fill="rgba(0,53,145,0.3)"/><rect x="208" y="82" width="16" height="40" fill="rgba(0,53,145,0.3)"/><rect x="228" y="74" width="18" height="48" fill="rgba(0,53,145,0.3)"/><rect x="250" y="86" width="20" height="36" fill="rgba(0,53,145,0.3)"/><circle cx="45" cy="18" r="1.2" fill="white" opacity="0.35"/><circle cx="230" cy="14" r="1" fill="white" opacity="0.35"/><circle cx="180" cy="22" r="1.2" fill="white" opacity="0.35"/></svg>`
  },
  sydney: {
    name: 'Sydney',
    city: 'Sydney',
    desc: 'Sydney Trains: Recognize the heritage and modern stations of NSW.',
    filter: s => s.city === 'Sydney',
    color: 'var(--sydney)',
    icon: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M8 8h8M12 8v10" stroke="white" stroke-width="3"/></svg>`
  }
};
