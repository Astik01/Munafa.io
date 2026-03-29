function getISTDate(date = new Date()) {
  // Use Intl to get time in Asia/Kolkata without external libs
  const isoString = date.toLocaleString('en-US', {
    timeZone: 'Asia/Kolkata',
    hour12: false
  });
  return new Date(isoString);
}

export function isMarketOpen() {
  const nowIST = getISTDate();

  const day = nowIST.getDay(); // 0 = Sunday, 6 = Saturday
  if (day === 0 || day === 6) {
    return false;
  }

  const hours = nowIST.getHours();
  const minutes = nowIST.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  const openMinutes = 9 * 60 + 15; // 9:15
  const closeMinutes = 15 * 60 + 30; // 15:30

  return totalMinutes >= openMinutes && totalMinutes <= closeMinutes;
}

export function getMarketStatus() {
  const nowIST = getISTDate();
  const day = nowIST.getDay();

  const hours = nowIST.getHours();
  const minutes = nowIST.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  const preOpenStart = 9 * 60 + 0; // 9:00
  const marketOpen = 9 * 60 + 15; // 9:15
  const marketClose = 15 * 60 + 30; // 15:30

  let isOpen = false;
  let label = 'Market Closed';
  let color = '#FF5252';

  if (day === 0 || day === 6) {
    return { isOpen: false, label, color };
  }

  if (totalMinutes >= marketOpen && totalMinutes <= marketClose) {
    isOpen = true;
    label = 'Market Open';
    color = '#00C853';
  } else if (totalMinutes >= preOpenStart && totalMinutes < marketOpen) {
    isOpen = false;
    label = 'Pre-Market';
    color = '#FFA726';
  }

  return { isOpen, label, color };
}

