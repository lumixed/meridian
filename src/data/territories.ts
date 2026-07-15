export interface TerritoryInfo {
  type: string
  geo: string
  note: string
  stations?: string
  coverage: string
}

export const TERRITORY_INFO: Record<string, TerritoryInfo> = {
  AQ: {
    type: 'Uninhabited Continent',
    geo: 'South Pole · 14.2 million km²',
    note: 'Governed under the Antarctic Treaty System (1959). No permanent civilian population.',
    stations: '70+ international research stations (COMNAP)',
    coverage: 'No World Bank economic indicators',
  },
  GL: {
    type: 'Autonomous Territory of Denmark',
    geo: 'North Atlantic & Arctic Ocean',
    note: 'Largest island on Earth. Self-governing within the Kingdom of Denmark since 2009.',
    coverage: 'Partially reported within Danish national accounts',
  },
  GF: {
    type: 'French Overseas Region',
    geo: 'Northern South America',
    note: 'Bordered by Brazil and Suriname. Part of the EU via France.',
    coverage: 'Included in French national accounts',
  },
  NC: {
    type: 'French Special Collectivity',
    geo: 'South Pacific Ocean',
    note: 'Major nickel producer. Significant French territory in Melanesia.',
    coverage: 'Partial — included in French overseas data',
  },
  PF: {
    type: 'French Overseas Collectivity',
    geo: 'South Pacific Ocean',
    note: 'Includes Tahiti. Tourism and pearl exports dominate the economy.',
    coverage: 'Partial data available',
  },
  TF: {
    type: 'French Southern Territories',
    geo: 'Southern Indian & Antarctic Ocean',
    note: 'Uninhabited administrative territory. Important for French EEZ claims.',
    coverage: 'No economic data published',
  },
  EH: {
    type: 'Disputed Territory',
    geo: 'Northwest Africa',
    note: 'Administered by Morocco, claimed by the Sahrawi Arab Democratic Republic. Phosphate deposits are economically significant.',
    coverage: 'Not independently tracked by the World Bank',
  },
  XK: {
    type: 'Partially Recognised State',
    geo: 'Southeast Europe · Balkans',
    note: 'Declared independence from Serbia in 2008. Recognised by roughly 100 UN members.',
    coverage: 'Limited World Bank data available',
  },
  PS: {
    type: 'Palestinian Territory',
    geo: 'Levant, Middle East',
    note: 'Includes the West Bank and Gaza Strip. The economy is heavily affected by ongoing conflict.',
    coverage: 'The World Bank publishes limited indicators for the Palestinian territories',
  },
  TW: {
    type: 'Self-Governing Territory',
    geo: 'East Asia, Pacific Ocean',
    note: 'High-income economy. Major semiconductor and electronics manufacturer.',
    coverage: 'Not reported in the World Bank dataset',
  },
  HK: {
    type: 'Special Administrative Region of China',
    geo: 'South China Sea',
    note: 'Major global financial centre under the "one country, two systems" framework.',
    coverage: 'Reported separately by some organisations; not standard World Bank',
  },
  MO: {
    type: 'Special Administrative Region of China',
    geo: 'South China, Pearl River Delta',
    note: 'Among the highest GDP per capita in Asia. Casino and tourism economy.',
    coverage: 'Limited World Bank reporting',
  },
  GU: {
    type: 'US Territory',
    geo: 'Western Pacific Ocean',
    note: 'US military strategic hub. Tourism and federal spending dominate.',
    coverage: 'Reported within US economic aggregates',
  },
  PR: {
    type: 'US Commonwealth Territory',
    geo: 'Caribbean Sea',
    note: 'Fiscally autonomous. Large pharmaceutical and manufacturing sector.',
    coverage: 'Partial World Bank data',
  },
  VI: {
    type: 'US Virgin Islands',
    geo: 'Caribbean Sea',
    note: 'Tourism-driven economy using the US dollar.',
    coverage: 'Reported within US aggregates',
  },
  CW: {
    type: 'Constituent Country of the Netherlands',
    geo: 'Southern Caribbean Sea',
    note: 'Oil refining hub within the Kingdom of the Netherlands.',
    coverage: 'Limited',
  },
  SS: {
    type: 'Sovereign State',
    geo: 'East-Central Africa',
    note: "The world's newest country (2011). Oil-dependent economy severely affected by conflict.",
    coverage: 'Very limited World Bank data due to instability',
  },
}
