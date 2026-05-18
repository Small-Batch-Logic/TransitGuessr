window.STATIONS = [
  // Toronto TTC — Yonge line
  { name: "Union Station",               system: "TTC",        city: "Toronto", lat: 43.6453, lng: -79.3806, heading: 180 },
  { name: "King Station",                system: "TTC",        city: "Toronto", lat: 43.6488, lng: -79.3776, heading: 270 },
  { name: "Queen Station",               system: "TTC",        city: "Toronto", lat: 43.6525, lng: -79.3794, heading: 90  },
  { name: "Dundas Station",              system: "TTC",        city: "Toronto", lat: 43.6562, lng: -79.3802, heading: 90  },
  { name: "College Station",             system: "TTC",        city: "Toronto", lat: 43.6601, lng: -79.3839, heading: 90  },
  { name: "Wellesley Station",           system: "TTC",        city: "Toronto", lat: 43.6646, lng: -79.3837, heading: 90  },
  { name: "Bloor–Yonge Station",         system: "TTC",        city: "Toronto", lat: 43.6711, lng: -79.3857, heading: 90  },
  { name: "Eglinton Station",            system: "TTC",        city: "Toronto", lat: 43.7051, lng: -79.3984, heading: 90  },
  { name: "Lawrence Station",            system: "TTC",        city: "Toronto", lat: 43.7232, lng: -79.4013, heading: 90  },
  { name: "York Mills Station",          system: "TTC",        city: "Toronto", lat: 43.7453, lng: -79.4032, heading: 90  },
  { name: "Sheppard–Yonge Station",      system: "TTC",        city: "Toronto", lat: 43.7615, lng: -79.4108, heading: 90  },
  { name: "Finch Station",               system: "TTC",        city: "Toronto", lat: 43.7803, lng: -79.4147, heading: 270 },

  // Toronto TTC — University/Spadina line
  { name: "Osgoode Station",             system: "TTC",        city: "Toronto", lat: 43.6506, lng: -79.3869, heading: 0   },
  { name: "St. Patrick Station",         system: "TTC",        city: "Toronto", lat: 43.6539, lng: -79.3862, heading: 0   },
  { name: "Queen's Park Station",        system: "TTC",        city: "Toronto", lat: 43.6596, lng: -79.3897, heading: 0   },
  { name: "Museum Station",              system: "TTC",        city: "Toronto", lat: 43.6673, lng: -79.3943, heading: 0   },
  { name: "St. George Station",          system: "TTC",        city: "Toronto", lat: 43.6686, lng: -79.3999, heading: 270 },
  { name: "Spadina Station",             system: "TTC",        city: "Toronto", lat: 43.6674, lng: -79.4038, heading: 270 },
  { name: "Bay Station",                 system: "TTC",        city: "Toronto", lat: 43.6696, lng: -79.3889, heading: 270 },

  // Toronto TTC — Bloor/Danforth & extensions
  { name: "Kipling Station",             system: "TTC",        city: "Toronto", lat: 43.6368, lng: -79.5357, heading: 90  },
  { name: "Kennedy Station",             system: "TTC",        city: "Toronto", lat: 43.7326, lng: -79.2637, heading: 270 },
  { name: "Wilson Station",              system: "TTC",        city: "Toronto", lat: 43.7405, lng: -79.4493, heading: 180 },
  { name: "Glencairn Station",           system: "TTC",        city: "Toronto", lat: 43.7117, lng: -79.4433, heading: 180 },
  { name: "Lawrence West Station",       system: "TTC",        city: "Toronto", lat: 43.7179, lng: -79.4524, heading: 180 },
  { name: "Downsview Park Station",      system: "TTC",        city: "Toronto", lat: 43.7530, lng: -79.4779, heading: 90  },
  { name: "Pioneer Village Station",     system: "TTC",        city: "Toronto", lat: 43.7849, lng: -79.4686, heading: 180 },
  { name: "Vaughan Metropolitan Centre", system: "TTC",        city: "Vaughan", lat: 43.7971, lng: -79.5293, heading: 90  },

  // Montreal STM
  { name: "Berri-UQAM",                  system: "STM Métro",  city: "Montréal",lat: 45.5178, lng: -73.5617, heading: 270 },
  { name: "McGill",                      system: "STM Métro",  city: "Montréal",lat: 45.5052, lng: -73.5711, heading: 90  },
  { name: "Place-des-Arts",              system: "STM Métro",  city: "Montréal",lat: 45.5093, lng: -73.5681, heading: 90  },
  { name: "Lionel-Groulx",               system: "STM Métro",  city: "Montréal",lat: 45.4731, lng: -73.5752, heading: 0   },
  { name: "Mont-Royal",                  system: "STM Métro",  city: "Montréal",lat: 45.5279, lng: -73.5833, heading: 90  },
  { name: "Sherbrooke",                  system: "STM Métro",  city: "Montréal",lat: 45.5177, lng: -73.5756, heading: 270 },
  { name: "Atwater",                     system: "STM Métro",  city: "Montréal",lat: 45.4930, lng: -73.5822, heading: 90  },
  { name: "Guy-Concordia",               system: "STM Métro",  city: "Montréal",lat: 45.4958, lng: -73.5779, heading: 90  },
  { name: "Snowdon",                     system: "STM Métro",  city: "Montréal",lat: 45.4904, lng: -73.6206, heading: 90  },
  { name: "Côte-Vertu",                  system: "STM Métro",  city: "Montréal",lat: 45.5127, lng: -73.7042, heading: 180 },

  // Vancouver SkyTrain
  { name: "Waterfront Station",          system: "SkyTrain",   city: "Vancouver",lat: 49.2866, lng: -123.1116, heading: 180 },
  { name: "Burrard Station",             system: "SkyTrain",   city: "Vancouver",lat: 49.2853, lng: -123.1207, heading: 90  },
  { name: "Granville Station",           system: "SkyTrain",   city: "Vancouver",lat: 49.2827, lng: -123.1187, heading: 0   },
  { name: "Stadium-Chinatown Station",   system: "SkyTrain",   city: "Vancouver",lat: 49.2793, lng: -123.1094, heading: 0   },
  { name: "Main Street-Science World",   system: "SkyTrain",   city: "Vancouver",lat: 49.2731, lng: -123.1003, heading: 0   },
  { name: "Commercial-Broadway Station", system: "SkyTrain",   city: "Vancouver",lat: 49.2631, lng: -123.0693, heading: 180 },
  { name: "Metrotown Station",           system: "SkyTrain",   city: "Burnaby",   lat: 49.2249, lng: -122.9990, heading: 0   },
  { name: "Surrey Central Station",      system: "SkyTrain",   city: "Surrey",lat: 49.1877, lng: -122.8455, heading: 180 },
  { name: "King George Station",         system: "SkyTrain",   city: "Surrey",lat: 49.1828, lng: -122.8456, heading: 0   },
  { name: "Lougheed Town Centre",        system: "SkyTrain",   city: "Burnaby",   lat: 49.2483, lng: -122.8985, heading: 180 },

  // NYC Subway
  { name: "Times Square–42nd St",        system: "NYC Subway", city: "New York",lat: 40.7557, lng: -73.9866, heading: 180 },
  { name: "Grand Central–42nd St",       system: "NYC Subway", city: "New York",lat: 40.7527, lng: -73.9772, heading: 270 },
  { name: "Union Square–14th St",        system: "NYC Subway", city: "New York",lat: 40.7353, lng: -73.9903, heading: 90  },
  { name: "Fulton Street",               system: "NYC Subway", city: "New York",lat: 40.7096, lng: -74.0078, heading: 90  },
  { name: "34th St–Penn Station",        system: "NYC Subway", city: "New York",lat: 40.7506, lng: -73.9939, heading: 90  },
  { name: "Atlantic Av–Barclays Ctr",    system: "NYC Subway", city: "Brooklyn",lat: 40.6840, lng: -73.9778, heading: 270 },
  { name: "125th Street",                system: "NYC Subway", city: "New York",lat: 40.8058, lng: -73.9379, heading: 270 },
  { name: "Borough Hall",                system: "NYC Subway", city: "Brooklyn",lat: 40.6929, lng: -73.9899, heading: 270 },
  { name: "Jay St–MetroTech",            system: "NYC Subway", city: "Brooklyn",lat: 40.6924, lng: -73.9870, heading: 90  },
  { name: "Chambers Street",             system: "NYC Subway", city: "New York",lat: 40.7135, lng: -74.0087, heading: 90  },

  // London Underground
  { name: "King's Cross St. Pancras",    system: "London Underground", city: "London",lat: 51.5309, lng: -0.1233, heading: 180 },
  { name: "Victoria",                    system: "London Underground", city: "London",lat: 51.4965, lng: -0.1447, heading: 90  },
  { name: "Oxford Circus",               system: "London Underground", city: "London",lat: 51.5154, lng: -0.1411, heading: 90  },
  { name: "Bank",                        system: "London Underground", city: "London",lat: 51.5133, lng: -0.0886, heading: 270 },
  { name: "Canary Wharf",               system: "London Underground", city: "London",lat: 51.5053, lng: -0.0195, heading: 180 },
  { name: "Waterloo",                    system: "London Underground", city: "London",lat: 51.5031, lng: -0.1133, heading: 0   },
  { name: "London Bridge",               system: "London Underground", city: "London",lat: 51.5052, lng: -0.0864, heading: 0   },
  { name: "Leicester Square",            system: "London Underground", city: "London",lat: 51.5113, lng: -0.1281, heading: 270 },
  { name: "Paddington",                  system: "London Underground", city: "London",lat: 51.5154, lng: -0.1755, heading: 180 },
  { name: "Piccadilly Circus",           system: "London Underground", city: "London",lat: 51.5098, lng: -0.1342, heading: 90  },

  // Paris RATP
  { name: "Châtelet",                    system: "RATP Métro", city: "Paris",lat: 48.8601, lng:  2.3477, heading: 90  },
  { name: "Gare du Nord",                system: "RATP Métro", city: "Paris",lat: 48.8809, lng:  2.3553, heading: 180 },
  { name: "République",                  system: "RATP Métro", city: "Paris",lat: 48.8675, lng:  2.3634, heading: 270 },
  { name: "Bastille",                    system: "RATP Métro", city: "Paris",lat: 48.8533, lng:  2.3692, heading: 270 },
  { name: "Nation",                      system: "RATP Métro", city: "Paris",lat: 48.8484, lng:  2.3957, heading: 270 },
  { name: "Montparnasse-Bienvenüe",      system: "RATP Métro", city: "Paris",lat: 48.8421, lng:  2.3220, heading: 90  },
  { name: "Saint-Lazare",                system: "RATP Métro", city: "Paris",lat: 48.8754, lng:  2.3243, heading: 180 },
  { name: "Opéra",                       system: "RATP Métro", city: "Paris",lat: 48.8710, lng:  2.3319, heading: 90  },

  // Tokyo Metro
  { name: "Shinjuku Station",            system: "Tokyo Metro", city: "Tokyo",lat: 35.6896, lng: 139.7006, heading: 90  },
  { name: "Shibuya Station",             system: "Tokyo Metro", city: "Tokyo",lat: 35.6580, lng: 139.7016, heading: 0   },
  { name: "Ikebukuro Station",           system: "Tokyo Metro", city: "Tokyo",lat: 35.7295, lng: 139.7109, heading: 90  },
  { name: "Tokyo Station",               system: "Tokyo Metro", city: "Tokyo",lat: 35.6812, lng: 139.7671, heading: 270 },
  { name: "Ueno Station",                system: "Tokyo Metro", city: "Tokyo",lat: 35.7141, lng: 139.7774, heading: 270 },
  { name: "Ginza Station",               system: "Tokyo Metro", city: "Tokyo",lat: 35.6717, lng: 139.7645, heading: 90  },
  { name: "Roppongi Station",            system: "Tokyo Metro", city: "Tokyo",lat: 35.6641, lng: 139.7315, heading: 0   },
  { name: "Akihabara Station",           system: "Tokyo Metro", city: "Tokyo",lat: 35.6984, lng: 139.7731, heading: 270 },

  // Chicago CTA (elevated L — skipped O'Hare & Midway: inside airport terminals)
  { name: "Howard Station",              system: "CTA",  city: "Chicago",lat: 42.0192, lng: -87.6726, heading: 180 },
  { name: "Belmont Station",             system: "CTA",  city: "Chicago",lat: 41.9397, lng: -87.6526, heading: 180 },
  { name: "Fullerton Station",           system: "CTA",  city: "Chicago",lat: 41.9247, lng: -87.6530, heading: 180 },
  { name: "Chicago/State Station",       system: "CTA",  city: "Chicago",lat: 41.8965, lng: -87.6313, heading: 180 },
  { name: "Jackson Station",             system: "CTA",  city: "Chicago",lat: 41.8781, lng: -87.6279, heading: 90  },
  { name: "Clark/Lake Station",          system: "CTA",  city: "Chicago",lat: 41.8857, lng: -87.6315, heading: 180 },
  { name: "Roosevelt Station",           system: "CTA",  city: "Chicago",lat: 41.8674, lng: -87.6266, heading: 90  },
  { name: "95th/Dan Ryan Station",       system: "CTA",  city: "Chicago",lat: 41.7225, lng: -87.6244, heading: 0   },

  // Berlin U-Bahn
  { name: "Alexanderplatz",              system: "U-Bahn", city: "Berlin",lat: 52.5219, lng: 13.4132, heading: 270 },
  { name: "Friedrichstraße",             system: "U-Bahn", city: "Berlin",lat: 52.5202, lng: 13.3881, heading: 180 },
  { name: "Potsdamer Platz",             system: "U-Bahn", city: "Berlin",lat: 52.5096, lng: 13.3761, heading: 90  },
  { name: "Zoologischer Garten",         system: "U-Bahn", city: "Berlin",lat: 52.5068, lng: 13.3328, heading: 180 },
  { name: "Stadtmitte",                  system: "U-Bahn", city: "Berlin",lat: 52.5136, lng: 13.3917, heading: 90  },
  { name: "Tempelhof",                   system: "U-Bahn", city: "Berlin",lat: 52.4785, lng: 13.3875, heading: 0   },
  { name: "Hermannplatz",                system: "U-Bahn", city: "Berlin",lat: 52.4872, lng: 13.4252, heading: 90  },
  { name: "Kurfürstendamm",              system: "U-Bahn", city: "Berlin",lat: 52.5026, lng: 13.3280, heading: 180 },

  // Sydney Trains
  { name: "Central Station",             system: "Sydney Trains", city: "Sydney", lat: -33.8834, lng: 151.2067, heading: 180 },
  { name: "Town Hall Station",           system: "Sydney Trains", city: "Sydney", lat: -33.8732, lng: 151.2063, heading: 0   },
  { name: "Wynyard Station",             system: "Sydney Trains", city: "Sydney", lat: -33.8655, lng: 151.2057, heading: 0   },
  { name: "Bondi Junction Station",      system: "Sydney Trains", city: "Sydney", lat: -33.8916, lng: 151.2486, heading: 90  },
  { name: "North Sydney Station",        system: "Sydney Trains", city: "Sydney", lat: -33.8396, lng: 151.2073, heading: 180 },
  { name: "Parramatta Station",          system: "Sydney Trains", city: "Sydney", lat: -33.8169, lng: 151.0034, heading: 90  },
  { name: "Strathfield Station",         system: "Sydney Trains", city: "Sydney", lat: -33.8710, lng: 151.0870, heading: 180 },
  { name: "Chatswood Station",           system: "Sydney Trains", city: "Sydney", lat: -33.7997, lng: 151.1818, heading: 0   },
  { name: "Circular Quay Station",       system: "Sydney Trains", city: "Sydney", lat: -33.8617, lng: 151.2108, heading: 180 },
  { name: "Museum Station",              system: "Sydney Trains", city: "Sydney", lat: -33.8760, lng: 151.2107, heading: 270 },

  // Additional NYC Subway
  { name: "Christopher St-Sheridan Sq",  system: "NYC Subway", city: "New York",lat: 40.7330, lng: -74.0029, heading: 0   },
  { name: "W 4th St-Wash Sq",           system: "NYC Subway", city: "New York",lat: 40.7323, lng: -74.0005, heading: 180 },
  { name: "59 St-Columbus Circle",       system: "NYC Subway", city: "New York",lat: 40.7682, lng: -73.9819, heading: 90  },

  // Additional London Underground
  { name: "Westminster",                 system: "London Underground", city: "London",lat: 51.5014, lng: -0.1249, heading: 180 },
  { name: "Green Park",                  system: "London Underground", city: "London",lat: 51.5069, lng: -0.1428, heading: 90  },
  { name: "South Kensington",            system: "London Underground", city: "London",lat: 51.4941, lng: -0.1738, heading: 0   },

  // Additional Tokyo Metro
  { name: "Harajuku Station",            system: "Tokyo Metro", city: "Tokyo",lat: 35.6702, lng: 139.7027, heading: 90  },
  { name: "Omotesando Station",          system: "Tokyo Metro", city: "Tokyo",lat: 35.6652, lng: 139.7113, heading: 0   },

  // Additional Paris RATP
  { name: "Charles de Gaulle-Étoile",    system: "RATP Métro", city: "Paris",lat: 48.8739, lng: 2.2950, heading: 90  },
  { name: "Franklin D. Roosevelt",       system: "RATP Métro", city: "Paris",lat: 48.8693, lng: 2.3093, heading: 180 },
];
