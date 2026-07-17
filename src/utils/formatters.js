const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2
});

export function formatINR(value) {
  if (value == null || isNaN(value)) return '₹0.00';
  return inrFormatter.format(Number(value));
}

export function formatChange(value) {
  if (value == null || isNaN(value)) return '0.00%';
  const num = Number(value);
  const sign = num > 0 ? '+' : num < 0 ? '-' : '';
  const abs = Math.abs(num).toFixed(2);
  return `${sign}${abs}%`;
}

export function formatVolume(value) {
  if (value == null || isNaN(value)) return '-';
  const num = Number(value);

  const abs = Math.abs(num);

  if (abs >= 1e7) {
    // Crores
    return `${(num / 1e7).toFixed(1)}Cr`;
  }
  if (abs >= 1e5) {
    // Lakhs
    return `${(num / 1e5).toFixed(1)}L`;
  }
  if (abs >= 1e3) {
    return `${(num / 1e3).toFixed(1)}K`;
  }
  return String(Math.round(num));
}

export function formatMarketCap(value) {
  if (value == null || isNaN(value)) return '-';
  const num = Number(value);

  if (num >= 1e7) {
    // in crore
    return `₹${(num / 1e7).toFixed(1)}L Cr`;
  }

  // Fallback: just format as INR
  return formatINR(num);
}

export function formatDate(timestamp) {
  if (!timestamp) return '';
  const date = new Date(timestamp);

  const now = new Date();
  const isToday =
    date.getDate() === now.getDate() &&
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear();

  const optionsDate = { day: 'numeric', month: 'short' };
  const optionsTime = { hour: 'numeric', minute: '2-digit' };

  if (isToday) {
    return date.toLocaleTimeString('en-IN', {
      ...optionsTime,
      hour12: true
    });
  }

  return date.toLocaleDateString('en-IN', optionsDate);
}

