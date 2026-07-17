// newsService.js — live market news via rss2json (ET Markets, Moneycontrol, Business Standard)
import { STOCKS } from './stockService';

const RSS2JSON_BASE = 'https://api.rss2json.com/v1/api.json';
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const FEEDS = [
  { source: 'ET Markets',       url: 'https://economictimes.indiatimes.com/markets/rssfeeds/1977021501.cms' },
  { source: 'Moneycontrol',     url: 'https://www.moneycontrol.com/rss/business.xml' },
  { source: 'Business Standard', url: 'https://www.business-standard.com/rss/markets-106.rss' },
];

const SECTOR_KEYWORDS = {
  banking: ['bank', 'hdfc', 'icici', 'sbi', 'kotak', 'axis', 'nbfc', 'finance'],
  it:      ['infosys', 'tcs', 'wipro', 'hcl', 'software', 'it stock', 'tech mahindra'],
  auto:    ['maruti', 'tata motors', 'auto ', 'eicher', 'mahindra', 'ev ', 'electric vehicle'],
  pharma:  ['pharma', 'drug', 'sun pharma', 'cipla', 'dr reddy', 'fda'],
};

let cache = { data: null, timestamp: 0 };

function detectSector(headline) {
  const lower = headline.toLowerCase();
  for (const [sector, keywords] of Object.entries(SECTOR_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return sector;
  }
  return 'all';
}

function detectStock(headline) {
  const lower = headline.toLowerCase();
  const match = STOCKS.find((s) => lower.includes(s.name.toLowerCase().split(' ')[0]));
  return match?.symbol || null;
}

function timeAgo(pubDate) {
  const diffMs = Date.now() - new Date(pubDate).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.floor(hrs / 24)} d ago`;
}

async function fetchFeed({ source, url }) {
  const apiUrl = `${RSS2JSON_BASE}?rss_url=${encodeURIComponent(url)}`;
  const res = await fetch(apiUrl);
  if (!res.ok) throw new Error(`rss2json HTTP ${res.status} for ${source}`);
  const data = await res.json();
  if (data.status !== 'ok') throw new Error(`rss2json error for ${source}`);

  return (data.items || []).slice(0, 12).map((item, i) => ({
    id: `${source}-${i}-${item.link}`,
    source,
    time: timeAgo(item.pubDate),
    pubDate: item.pubDate,
    headline: item.title,
    sector: detectSector(item.title),
    relatedStock: detectStock(item.title),
    url: item.link,
  }));
}

export async function fetchMarketNews() {
  if (cache.data && Date.now() - cache.timestamp < CACHE_TTL_MS) {
    return cache.data;
  }

  const results = await Promise.allSettled(FEEDS.map(fetchFeed));
  const merged = results
    .filter((r) => r.status === 'fulfilled')
    .flatMap((r) => r.value)
    .sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));

  cache = { data: merged, timestamp: Date.now() };
  return merged;
}