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
    icon: `<svg viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="currentColor"/><path d="M6 8h12v3h-4.5v5h-3v-5H6V8z" fill="white"/></svg>`
  },
  montreal: {
    name: 'Montréal',
    city: 'Montréal',
    desc: 'Navigating the STM: Every station in the Montréal Metro system.',
    filter: s => s.city === 'Montréal',
    color: 'var(--stm)',
    icon: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M8 9l4 4 4-4" stroke="white" stroke-width="3" fill="none"/></svg>`
  },
  vancouver: {
    name: 'Vancouver',
    city: 'Vancouver',
    desc: 'The SkyTrain network: All Expo, Millennium, and Canada Line stations.',
    filter: s => ['Vancouver', 'Burnaby', 'Surrey'].includes(s.city),
    color: 'var(--skytrain)',
    icon: `<svg viewBox="0 0 24 24"><rect width="24" height="24" rx="4" fill="currentColor"/><path d="M12 6v12M7 9h10" stroke="white" stroke-width="3"/></svg>`
  },
  nyc: {
    name: 'New York',
    city: 'New York',
    desc: 'The city that never sleeps: Iconic entrances across all five boroughs.',
    filter: s => ['New York', 'Brooklyn'].includes(s.city),
    color: 'var(--nyc)',
    icon: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M9 15.5c0-2 1.5-3.5 3-3.5s3 1.5 3 3.5m-3-7V12" stroke="black" stroke-width="2.5"/></svg>`
  },
  london: {
    name: 'London',
    city: 'London',
    desc: 'Mind the Gap: Stations across the Underground and DLR networks.',
    filter: s => s.city === 'London',
    color: 'var(--tube)',
    icon: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8" stroke="currentColor" stroke-width="3" fill="none"/><rect x="2" y="10" width="20" height="4" fill="#0019a8"/></svg>`
  },
  paris: {
    name: 'Paris',
    city: 'Paris',
    desc: 'Le Métro: Art Nouveau entrances and urban landmarks of Paris.',
    filter: s => s.city === 'Paris',
    color: 'var(--ratp)',
    icon: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M7 16V8l5 5 5-5v8" stroke="white" stroke-width="2.5" fill="none"/></svg>`
  },
  tokyo: {
    name: 'Tokyo',
    city: 'Tokyo',
    desc: 'Tokyo Metro optimization: High-density rail across the megalopolis.',
    filter: s => s.city === 'Tokyo',
    color: 'var(--tokyo)',
    icon: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="currentColor"/><path d="M7 15V9l5 4 5-4v6" stroke="white" stroke-width="2.5" fill="none"/></svg>`
  },
  chicago: {
    name: 'Chicago',
    city: 'Chicago',
    desc: 'The "L": Elevated lines and subterranean stations in the Windy City.',
    filter: s => s.city === 'Chicago',
    color: 'var(--cta)',
    icon: `<svg viewBox="0 0 24 24"><rect x="4" y="8" width="16" height="8" rx="4" fill="currentColor"/><text x="12" y="15" font-size="10" text-anchor="middle" fill="white" font-weight="900" font-family="Arial">L</text></svg>`
  },
  berlin: {
    name: 'Berlin',
    city: 'Berlin',
    desc: 'U-Bahn History: Navigate the iconic yellow trains and brutalist architecture.',
    filter: s => s.city === 'Berlin',
    color: 'var(--ubahn)',
    icon: `<svg viewBox="0 0 24 24"><rect width="24" height="24" rx="2" fill="currentColor"/><text x="12" y="18" font-size="16" text-anchor="middle" fill="#003591" font-weight="900" font-family="Arial">U</text></svg>`
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
