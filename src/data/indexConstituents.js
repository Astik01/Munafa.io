// Hardcoded index constituent lists — Yahoo Finance has no constituents API

export const INDEX_META = {
  nifty50: {
    id: 'nifty50',
    name: 'NIFTY 50',
    yahooSymbol: '^NSEI',
  },
  sensex: {
    id: 'sensex',
    name: 'SENSEX',
    yahooSymbol: '^BSESN',
  },
  banknifty: {
    id: 'banknifty',
    name: 'BANK NIFTY',
    yahooSymbol: '^NSEBANK',
  },
  niftyit: {
    id: 'niftyit',
    name: 'NIFTY IT',
    yahooSymbol: '^CNXIT',
  },
  finnifty: {
    id: 'finnifty',
    name: 'FINNIFTY',
    yahooSymbol: '^CNXFIN',
  },
};

export const INDEX_CONSTITUENTS = {
  nifty50: [
    'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK',
    'HINDUNILVR', 'ITC', 'SBIN', 'BHARTIARTL', 'KOTAKBANK',
    'LT', 'AXISBANK', 'ASIANPAINT', 'MARUTI', 'TITAN',
    'SUNPHARMA', 'ULTRACEMCO', 'BAJFINANCE', 'NESTLEIND', 'WIPRO',
    'POWERGRID', 'NTPC', 'ONGC', 'JSWSTEEL', 'COALINDIA',
    'M&M', 'HCLTECH', 'ADANIENT', 'TATAMOTORS', 'TECHM',
    'DRREDDY', 'CIPLA', 'BAJAJFINSV', 'DIVISLAB', 'GRASIM',
    'HINDALCO', 'BPCL', 'TATACONSUM', 'HEROMOTOCO', 'EICHERMOT',
    'APOLLOHOSP', 'ADANIPORTS', 'SBILIFE', 'BRITANNIA', 'HDFCLIFE',
    'INDUSINDBK', 'BAJAJ-AUTO', 'UPL', 'TATASTEEL', 'LTF',
  ],
  sensex: [
    'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK',
    'HINDUNILVR', 'ITC', 'SBIN', 'BHARTIARTL', 'KOTAKBANK',
    'LT', 'AXISBANK', 'ASIANPAINT', 'MARUTI', 'TITAN',
    'SUNPHARMA', 'ULTRACEMCO', 'BAJFINANCE', 'NESTLEIND', 'WIPRO',
    'POWERGRID', 'NTPC', 'ONGC', 'JSWSTEEL', 'COALINDIA',
    'M&M', 'HCLTECH', 'TATAMOTORS', 'TECHM', 'BAJAJFINSV',
  ],
  banknifty: [
    'HDFCBANK', 'ICICIBANK', 'KOTAKBANK', 'AXISBANK', 'SBIN',
    'INDUSINDBK', 'BANDHANBNK', 'FEDERALBNK', 'IDFCFIRSTB', 'PNB',
    'AUBANK', 'RBLBANK',
  ],
  niftyit: [
    'TCS', 'INFY', 'HCLTECH', 'WIPRO', 'TECHM',
    'MPHASIS', 'LTIM', 'PERSISTENT', 'COFORGE', 'OFSS',
  ],
  finnifty: [
    'HDFCBANK', 'ICICIBANK', 'KOTAKBANK', 'AXISBANK', 'SBIN',
    'BAJFINANCE', 'BAJAJFINSV', 'SBILIFE', 'HDFCLIFE', 'INDUSINDBK',
  ],
};
