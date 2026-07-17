const STORAGE_KEY = 'munafa_watchlist';
const EVENT_NAME = 'watchlist:updated';

function readWatchlist() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeWatchlist(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent(EVENT_NAME));
}

export function getWatchlist() {
  return readWatchlist();
}

export function isInWatchlist(symbol) {
  return readWatchlist().some((item) => item.symbol === symbol);
}

export function addToWatchlist(stock) {
  const list = readWatchlist();
  if (list.some((item) => item.symbol === stock.symbol)) return list;
  const updated = [...list, { symbol: stock.symbol, name: stock.name ?? stock.symbol, addedAt: Date.now() }];
  writeWatchlist(updated);
  return updated;
}

export function removeFromWatchlist(symbol) {
  const updated = readWatchlist().filter((item) => item.symbol !== symbol);
  writeWatchlist(updated);
  return updated;
}

export function toggleWatchlist(stock) {
  return isInWatchlist(stock.symbol) ? removeFromWatchlist(stock.symbol) : addToWatchlist(stock);
}

export const WATCHLIST_EVENT = EVENT_NAME;