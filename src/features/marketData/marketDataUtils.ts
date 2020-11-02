import { CurrencySymbols, CurrencyType } from "../../components/utils/types";
import { env } from "../../constants/environmentVariables";
import { getBandchain } from "../../services/bandchain";

const mapToBandchainCurrencySymbol = (symbol: CurrencyType) => {
  switch (symbol) {
    case CurrencySymbols.DOTS:
      return "DOT";
    case CurrencySymbols.RENBCH:
      return "";
    case CurrencySymbols.RENDOGE:
      return "";
    case CurrencySymbols.RENZEC:
      return "";
    case CurrencySymbols.RENDGB:
      return "";
  }
  return symbol;
};

const mapToBridgeCurrencySymbol = (symbol: string) => {
  switch (symbol) {
    case "DOT":
      return CurrencySymbols.RENBCH;
  }
  return symbol as CurrencyType;
};

const QUOTE = "USD";

const getPair = (base: string, quote: string) => `${base}/${quote}`;

const referenceParis = Object.values(CurrencySymbols)
  .map(mapToBandchainCurrencySymbol)
  .filter((symbol) => !!symbol)
  .map((symbol: string) => getPair(symbol, QUOTE));

type BandchainExchangeRateEntry = {
  pair: string;
  rate: number;
  updated: {
    base: number;
    quote: number;
  };
};

const mapToExchangeData = (
  referenceData: Array<BandchainExchangeRateEntry>
) => {
  return referenceData.map((entry: any) => {
    const [base, quote] = entry.pair.split("/");
    const data: ExchangeRate = {
      pair: getPair(mapToBridgeCurrencySymbol(base), quote),
      rate: entry.rate,
    };
    return data;
  });
};

export type ExchangeRate = {
  pair: string;
  rate: number;
};

export const fetchMarketDataRates = async () => {
  console.log("fetching");
  return getBandchain()
    .getReferenceData(referenceParis)
    .then(mapToExchangeData);
};

export const findExchangeRate = (
  // TODO: CRIT: investigate what to do with nonexistent currencies
  exchangeRates: Array<ExchangeRate>,
  base: CurrencyType,
  quote = QUOTE
) => {
  const rateEntry = exchangeRates.find(
    (entry) => entry.pair === getPair(base, quote)
  );
  return rateEntry?.rate || 0;
};

export type AnyBlockGasPrices = {
  health: boolean;
  blockNumber: number;
  blockTime: number;
  slow: number;
  standard: number;
  fast: number;
  instant: number;
};

export const fetchMarketDataGasPrices = () =>
  fetch(env.GAS_FEE_ENDPOINT)
    .then((response) => response.json())
    .then((data : AnyBlockGasPrices) => {
      console.log("gas", data);
      return data;
    });
