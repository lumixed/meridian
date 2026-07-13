type SectorTriple = [string, string, string]

const COUNTRY_SECTORS: Record<string, SectorTriple> = {
  US: ['Technology & AI',            'Healthcare & Biotech',       'Financial Services'],
  CN: ['Manufacturing & Export',     'Technology & Consumer',      'Green Energy Transition'],
  IN: ['IT Services & SaaS',         'Pharmaceuticals & Generics', 'Infrastructure & Construction'],
  DE: ['Automotive & Engineering',   'Chemicals & Industrial',     'Renewable Energy'],
  JP: ['Advanced Manufacturing',     'Robotics & Automation',      'Financial Services'],
  GB: ['Financial Services',         'Life Sciences & CRO',        'Creative Industries'],
  FR: ['Luxury & Consumer Goods',    'Aerospace & Defense',        'Nuclear Energy'],
  KR: ['Semiconductors',             'Consumer Electronics',       'Shipbuilding'],
  CA: ['Energy & Natural Gas',       'Financial Services',         'Technology & AI'],
  AU: ['Mining & Resources',         'Agriculture & Food',         'Financial Services'],
  BR: ['Agriculture & Commodities',  'Oil & Gas (pre-salt)',       'Digital Fintech'],
  MX: ['Manufacturing & Auto',       'Oil & Gas (Pemex)',          'Tourism & Services'],
  SA: ['Oil & Gas',                  'Vision 2030 Projects',       'Tourism & Hospitality'],
  AE: ['Financial Services & FinTech', 'Real Estate & Construction', 'Tourism & Aviation'],
  SG: ['Financial Services',         'Biotechnology & Medtech',    'Logistics & Trade Hub'],
  ZA: ['Mining & Platinum',          'Financial Services',         'Agriculture & Food'],
  NG: ['Oil & Gas',                  'Fintech & Digital Banking',  'Agriculture'],
  KE: ['Financial Services (M-Pesa)', 'Agriculture & Floriculture', 'Technology & BPO'],
  TR: ['Tourism & Hospitality',      'Manufacturing & Textiles',   'Energy & Defense'],
  ID: ['Digital Economy',            'Nickel & Battery Metals',    'Palm Oil & Agriculture'],
  TH: ['Tourism & Hospitality',      'Automotive OEM',             'Electronics Manufacturing'],
  VN: ['Electronics Manufacturing',  'Tourism & Hospitality',      'Agriculture & Seafood'],
  PH: ['BPO & IT Services',          'Remittances & Fintech',      'Mining & Nickel'],
  PK: ['Textiles & Garments',        'Agriculture',                'IT & Software Export'],
  BD: ['Garments & RMG',             'Remittances',                'Digital Services'],
  IL: ['Technology & Cybersecurity', 'Life Sciences & MedTech',    'Agri-Tech & Water'],
  QA: ['LNG & Energy Export',        'Financial Services',         'Construction & Real Estate'],
  AR: ['Agriculture & Soy',          'Lithium & Battery Metals',   'Technology'],
  CL: ['Copper & Mining',            'Agriculture & Wine Export',  'Financial Services'],
  CO: ['Oil & Gas',                  'Coffee & Floriculture',      'Technology Hubs'],
  PL: ['Manufacturing',              'IT Services & Outsourcing',  'Agriculture'],
  NL: ['Financial Services',         'High-Tech Agriculture',      'Logistics & Port (Rotterdam)'],
  CH: ['Financial Services',         'Pharmaceuticals & MedTech',  'Luxury & Precision Goods'],
  SE: ['Technology & Gaming',        'Green Energy & Clean Tech',  'Engineering & Industrials'],
  NO: ['Oil & Gas (North Sea)',      'Seafood & Aquaculture',      'Maritime Services'],
  DK: ['Pharmaceuticals (Novo)',     'Wind Energy (Ørsted)',       'Shipping & Logistics'],
  FI: ['Technology & Telecom',       'Forest & Paper Industries',  'Maritime & Shipping'],
  MY: ['Palm Oil & Oleochemicals',   'Semiconductors & E&E',       'Tourism & Hospitality'],
  NZ: ['Agriculture & Dairy',        'Tourism',                    'Technology'],
  RU: ['Oil & Gas',                  'Mining & Metals',            'Defense & Aerospace'],
  EG: ['Suez Canal & Logistics',     'Tourism',                    'Natural Gas & Energy'],
  IR: ['Oil & Gas',                  'Petrochemicals',             'Agriculture'],
  UA: ['Agriculture & Grain',        'Steel & Metals',             'IT & Software'],
  OM: ['Oil & Gas',                  'Logistics & Port',           'Tourism & Fisheries'],
  KW: ['Oil & Petrochemicals',       'Financial Services',         'Real Estate'],
  GH: ['Oil & Cocoa',                'Gold Mining',                'Financial Services'],
  MA: ['Phosphates & Chemicals',     'Tourism',                    'Auto & Aerospace'],
  ET: ['Coffee & Agriculture',       'Manufacturing',              'Aviation (Ethiopian)'],
  TZ: ['Tourism & Safari',           'Agriculture & Coffee',       'Natural Gas'],
  ZW: ['Mining (Platinum/Chrome)',   'Agriculture (Tobacco)',      'Financial Services'],
  TN: ['Tourism',                    'Olive Oil & Agriculture',    'ICT & Outsourcing'],
  SN: ['Mining (Gold/Phosphates)',   'Tourism & Hospitality',      'Fisheries'],
  CI: ['Cocoa & Coffee',             'Oil & Gas',                  'Financial Services'],
  KZ: ['Oil & Gas',                  'Mining & Metals',            'Financial Services'],
  LK: ['Tourism',                    'Garments & Textiles',        'Tea & Agriculture'],
  MM: ['Natural Gas',                'Agriculture',                'Jade & Gems'],
  NP: ['Hydropower',                 'Tourism',                    'Remittances'],
}

const REGION_SECTORS: [string[], SectorTriple][] = [
  [['sub-saharan', 'africa'], ['Mining & Resources', 'Agriculture & Food', 'Financial Services']],
  [['middle east', 'north africa'], ['Oil & Energy', 'Financial Services', 'Real Estate & Construction']],
  [['latin', 'caribbean'], ['Commodities & Resources', 'Agriculture', 'Digital Economy']],
  [['south asia'], ['Textiles & Garments', 'Agriculture', 'IT Services']],
  [['southeast asia'], ['Manufacturing', 'Tourism', 'Agriculture']],
  [['east asia'], ['Manufacturing & Export', 'Technology', 'Financial Services']],
  [['europe'], ['Manufacturing', 'Financial Services', 'Tourism']],
]

const DEFAULT_SECTORS: SectorTriple = ['Services & Trade', 'Agriculture & Resources', 'Manufacturing']

export function getCountrySectors(code: string, region: string | null | undefined): SectorTriple {
  const direct = COUNTRY_SECTORS[code]
  if (direct) return direct

  const r = (region ?? '').toLowerCase()
  for (const [keywords, sectors] of REGION_SECTORS) {
    if (keywords.some(k => r.includes(k))) return sectors
  }
  return DEFAULT_SECTORS
}
