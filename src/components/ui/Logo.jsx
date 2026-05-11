import { useEffect, useMemo, useState } from 'react';

const STOCK_DOMAINS = {
  AAPL: 'apple.com',
  ADRO: 'adaro.com',
  AMZN: 'amazon.com',
  ANTM: 'antam.com',
  ASII: 'astra.co.id',
  BBCA: 'bca.co.id',
  BBNI: 'bni.co.id',
  BBRI: 'bri.co.id',
  BMRI: 'bankmandiri.co.id',
  BREN: 'barito-renewables.com',
  GOTO: 'goto.com',
  GOOG: 'google.com',
  GOOGL: 'abc.xyz',
  ICBP: 'indofoodcbp.com',
  INDF: 'indofood.com',
  MDKA: 'merdekacoppergold.com',
  MEDC: 'medcoenergi.com',
  META: 'meta.com',
  MSFT: 'microsoft.com',
  NFLX: 'netflix.com',
  NVDA: 'nvidia.com',
  PGAS: 'pgn.co.id',
  PTBA: 'ptba.co.id',
  TLKM: 'telkom.co.id',
  TPIA: 'chandra-asri.com',
  TSLA: 'tesla.com',
  UNVR: 'unilever.co.id',
};

const CRYPTO_DOMAINS = {
  BTC: 'bitcoin.org',
  BITCOIN: 'bitcoin.org',
  ETH: 'ethereum.org',
  ETHEREUM: 'ethereum.org',
  SOL: 'solana.com',
  SOLANA: 'solana.com',
  BNB: 'bnbchain.org',
  XRP: 'xrpl.org',
  DOGE: 'dogecoin.com',
  ADA: 'cardano.org',
  USDT: 'tether.to',
  USDC: 'circle.com',
};

function cleanDomain(value = '') {
  return value
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .split('/')[0];
}

function normalizeSymbol(value = '') {
  return value
    .trim()
    .toUpperCase()
    .replace(/\.(JK|IDX|US)$/i, '')
    .replace(/[^A-Z0-9]/g, '');
}

function getInitials(value = '') {
  const words = value.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();
  return words.slice(0, 2).map((word) => word[0]).join('').toUpperCase();
}

function resolveDomain({ domain, ticker, name, type }) {
  const manualDomain = cleanDomain(domain);
  if (manualDomain) return manualDomain;

  const symbol = normalizeSymbol(ticker || name);
  const label = normalizeSymbol(name);
  const isCrypto = String(type || '').toLowerCase().includes('crypto');

  if (isCrypto && (CRYPTO_DOMAINS[symbol] || CRYPTO_DOMAINS[label])) {
    return CRYPTO_DOMAINS[symbol] || CRYPTO_DOMAINS[label];
  }

  return STOCK_DOMAINS[symbol] || STOCK_DOMAINS[label] || '';
}

export default function Logo({
  domain,
  ticker,
  name,
  type,
  alt,
  className,
}) {
  const [sourceIndex, setSourceIndex] = useState(0);
  const label = name || ticker || domain || 'Asset';
  const resolvedDomain = useMemo(
    () => resolveDomain({ domain, ticker, name, type }),
    [domain, ticker, name, type]
  );
  const logoUrls = useMemo(() => {
    if (!resolvedDomain) return [];
    return [
      `https://logo.clearbit.com/${resolvedDomain}`,
      `https://www.google.com/s2/favicons?domain=${encodeURIComponent(resolvedDomain)}&sz=128`,
      `https://icons.duckduckgo.com/ip3/${resolvedDomain}.ico`,
    ];
  }, [resolvedDomain]);

  useEffect(() => {
    setSourceIndex(0);
  }, [resolvedDomain, label, type]);

  const logoClassName = className || 'asset-logo';

  if (!logoUrls.length || sourceIndex >= logoUrls.length) {
    return (
      <span className={`${logoClassName} asset-logo-fallback`} aria-label={alt || label}>
        {getInitials(label)}
      </span>
    );
  }

  return (
    <img
      src={logoUrls[sourceIndex]}
      alt={alt || label}
      className={logoClassName}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setSourceIndex((index) => index + 1)}
    />
  );
}
