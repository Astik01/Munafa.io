// Dummy news data — 24 realistic items covering multiple sectors

const NEWS_DATA = [
  { id: 1, source: 'ET', time: '12 min ago', headline: 'Reliance Industries Q4 net profit surges 12% YoY to ₹19,299 crore on strong O2C and retail growth', sector: 'all', relatedStock: 'RELIANCE', change: 2.34, changePercent: 2.34, url: 'https://economictimes.com' },
  { id: 2, source: 'CNBC', time: '28 min ago', headline: 'HDFC Bank sees 22% jump in advances, deposits grow 16% in Q4 FY25 provisional data', sector: 'banking', relatedStock: 'HDFCBANK', change: -1.56, changePercent: -1.56, url: 'https://cnbctv18.com' },
  { id: 3, source: 'TOI', time: '45 min ago', headline: 'Infosys bags $2 billion cloud transformation deal with European telecom giant Deutsche Telekom', sector: 'it', relatedStock: 'INFY', change: 3.91, changePercent: 3.91, url: 'https://timesofindia.com' },
  { id: 4, source: 'BS', time: '1 hr ago', headline: 'Tata Motors EV subsidiary posts first-ever operating profit ahead of planned IPO in H2 2025', sector: 'auto', relatedStock: 'TATAMOTORS', change: 2.34, changePercent: 2.34, url: 'https://business-standard.com' },
  { id: 5, source: 'ET', time: '1 hr ago', headline: 'Sun Pharma receives US FDA approval for generic diabetes drug Dapagliflozin, shares rally 3%', sector: 'pharma', relatedStock: 'SUNPHARMA', change: 2.98, changePercent: 2.98, url: 'https://economictimes.com' },
  { id: 6, source: 'CNBC', time: '1.5 hr ago', headline: 'ICICI Bank launches AI-powered credit underwriting platform, targets 40% faster loan approvals', sector: 'banking', relatedStock: 'ICICIBANK', change: 1.12, changePercent: 1.12, url: 'https://cnbctv18.com' },
  { id: 7, source: 'TOI', time: '2 hr ago', headline: 'Nifty 50 breaks below 22,800 as FIIs sell ₹3,200 crore; banks and metals lead the decline', sector: 'all', relatedStock: 'NIFTY', change: -1.28, changePercent: -1.28, url: 'https://timesofindia.com' },
  { id: 8, source: 'BS', time: '2 hr ago', headline: 'Wipro wins $500 million deal from UK-based financial services firm for digital transformation', sector: 'it', relatedStock: 'WIPRO', change: 2.78, changePercent: 2.78, url: 'https://business-standard.com' },
  { id: 9, source: 'ET', time: '2.5 hr ago', headline: 'NTPC Green Energy arm signs MoU for 5GW renewable energy capacity in Rajasthan with state govt', sector: 'all', relatedStock: 'NTPC', change: 4.15, changePercent: 4.15, url: 'https://economictimes.com' },
  { id: 10, source: 'CNBC', time: '3 hr ago', headline: 'Maruti Suzuki April sales rise 8% YoY on strong demand for SUVs; Brezza and Grand Vitara lead', sector: 'auto', relatedStock: 'MARUTI', change: -1.98, changePercent: -1.98, url: 'https://cnbctv18.com' },
  { id: 11, source: 'BS', time: '3 hr ago', headline: 'Bajaj Finance AUM crosses ₹3.5 lakh crore; management guides for 28% growth in FY26', sector: 'banking', relatedStock: 'BAJFINANCE', change: 3.24, changePercent: 3.24, url: 'https://business-standard.com' },
  { id: 12, source: 'TOI', time: '3.5 hr ago', headline: 'Dr Reddy\'s Laboratories gets USFDA nod for biosimilar Adalimumab; targets $1 billion market', sector: 'pharma', relatedStock: 'DRREDDY', change: 1.87, changePercent: 1.87, url: 'https://timesofindia.com' },
  { id: 13, source: 'ET', time: '4 hr ago', headline: 'Adani Enterprises green hydrogen unit secures $1.2 billion financing from Japanese consortium', sector: 'all', relatedStock: 'ADANIENT', change: -2.87, changePercent: -2.87, url: 'https://economictimes.com' },
  { id: 14, source: 'CNBC', time: '4 hr ago', headline: 'TCS launches new generative AI platform TCS AI.Cloud; expects to drive 15% revenue uplift', sector: 'it', relatedStock: 'TCS', change: -0.34, changePercent: -0.34, url: 'https://cnbctv18.com' },
  { id: 15, source: 'BS', time: '4.5 hr ago', headline: 'Power Grid Corporation wins ₹8,500 crore transmission project in Madhya Pradesh under TBCB', sector: 'all', relatedStock: 'POWERGRID', change: 2.45, changePercent: 2.45, url: 'https://business-standard.com' },
  { id: 16, source: 'TOI', time: '5 hr ago', headline: 'Kotak Mahindra Bank to acquire micro-finance lender for ₹4,200 crore to expand rural presence', sector: 'banking', relatedStock: 'KOTAKBANK', change: -1.23, changePercent: -1.23, url: 'https://timesofindia.com' },
  { id: 17, source: 'ET', time: '5 hr ago', headline: 'Cipla enters strategic partnership with Moderna for mRNA vaccine manufacturing in India', sector: 'pharma', relatedStock: 'CIPLA', change: 4.56, changePercent: 4.56, url: 'https://economictimes.com' },
  { id: 18, source: 'CNBC', time: '5.5 hr ago', headline: 'Titan Company opens 50 new Tanishq stores in tier-2 cities; targets ₹50,000 crore revenue by FY26', sector: 'all', relatedStock: 'TITAN', change: 1.87, changePercent: 1.87, url: 'https://cnbctv18.com' },
  { id: 19, source: 'BS', time: '6 hr ago', headline: 'HCL Technologies bags multi-year deal worth $700 million from US healthcare giant for cloud migration', sector: 'it', relatedStock: 'HCLTECH', change: 2.12, changePercent: 2.12, url: 'https://business-standard.com' },
  { id: 20, source: 'TOI', time: '6 hr ago', headline: 'Axis Bank reports 18% growth in net profit for Q4; NIM expands by 12 bps to 4.12%', sector: 'banking', relatedStock: 'AXISBANK', change: -0.98, changePercent: -0.98, url: 'https://timesofindia.com' },
  { id: 21, source: 'ET', time: '7 hr ago', headline: 'Mahindra & Mahindra electric SUV XEV 9e gets 25,000+ bookings within first week of launch', sector: 'auto', relatedStock: 'M&M', change: 3.45, changePercent: 3.45, url: 'https://economictimes.com' },
  { id: 22, source: 'CNBC', time: '7 hr ago', headline: 'SBI raises fixed deposit rates by 25 bps across select tenures; new rates effective April 1', sector: 'banking', relatedStock: 'SBIN', change: -0.89, changePercent: -0.89, url: 'https://cnbctv18.com' },
  { id: 23, source: 'BS', time: '8 hr ago', headline: 'Bharti Airtel 5G subscriber base crosses 100 million; ARPU rises to ₹233 in Q4', sector: 'all', relatedStock: 'BHARTIARTL', change: 1.56, changePercent: 1.56, url: 'https://business-standard.com' },
  { id: 24, source: 'TOI', time: '8 hr ago', headline: 'Eicher Motors Royal Enfield exports surge 42% in March; Himalayan 450 driving international demand', sector: 'auto', relatedStock: 'EICHERMOT', change: 2.89, changePercent: 2.89, url: 'https://timesofindia.com' },
];

// Source color map
export const SOURCE_COLORS = {
  ET:   { bg: 'rgba(33,150,243,0.12)', color: '#2196F3' },
  CNBC: { bg: 'rgba(156,39,176,0.12)', color: '#9C27B0' },
  TOI:  { bg: 'rgba(255,87,34,0.12)',  color: '#FF5722' },
  BS:   { bg: 'rgba(0,150,136,0.12)',  color: '#009688' },
};

// Sector tabs
export const NEWS_TABS = [
  { label: 'All News', key: 'all' },
  { label: 'Nifty 50', key: 'all' },
  { label: 'Banking',  key: 'banking' },
  { label: 'IT',       key: 'it' },
  { label: 'Auto',     key: 'auto' },
  { label: 'Pharma',   key: 'pharma' },
];

export default NEWS_DATA;
