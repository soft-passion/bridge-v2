import { createSelector, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { CurrencySymbols, CurrencyType } from "../../components/utils/types";
import { RootState } from "../../store/rootReducer";
import { $exchangeRates } from "../marketData/marketDataSlice";
import { findExchangeRate } from "../marketData/marketDataUtils";
import { $fees } from "../renData/renDataSlice";
import { CalculatedFee } from "../renData/renDataUtils";

type MintState = {
  currency: CurrencyType;
  amount: number;
};

let initialState: MintState = {
  currency: CurrencySymbols.BTC,
  amount: 0,
};

const slice = createSlice({
  name: "mint",
  initialState,
  reducers: {
    setMintCurrency(state, action: PayloadAction<CurrencyType>) {
      state.currency = action.payload;
    },
    setMintAmount(state, action: PayloadAction<number>) {
      state.amount = action.payload;
    },
    reset(state, action: PayloadAction<MintState | undefined>) {
      state = action.payload || initialState;
    },
  },
});

export const { setMintCurrency, setMintAmount } = slice.actions;

export const mintReducer = slice.reducer;

export const $mint = (state: RootState) => state.mint;
export const $mintCurrency = createSelector($mint, (mint) => mint.currency);
export const $mintAmount = createSelector($mint, (mint) => mint.amount);

export const $mintCurrencyUsdRate = createSelector(
  $mintCurrency,
  $exchangeRates,
  (currencySymbol, rates) => findExchangeRate(rates, currencySymbol, "USD")
);

export const $mintCurrencyUsdAmount = createSelector(
  $mintAmount,
  $mintCurrencyUsdRate,
  (amount, rate) => amount * rate
);

// TODO: probably should be calculated based on selected flow
export const $mintFees = createSelector(
  [$mintAmount, $mintCurrency, $fees],
  (amount, currency, fees) => {
    const currencyFee = fees.find((feeEntry) => feeEntry.symbol === currency);
    const feeData: CalculatedFee = {
      renVMFee: 0,
      networkFee: 0,
      conversionTotal: amount,
    };
    if (currencyFee) {
      feeData.networkFee = Number(currencyFee.lock) / 10 ** 8;
      feeData.renVMFee = Number(
        Number(amount) * Number(Number(currencyFee.ethereum.mint) / 10000)
      );
      feeData.conversionTotal =
        Number(Number(amount) - Number(feeData.renVMFee) - feeData.networkFee) >
        0
          ? Number(amount - Number(feeData.renVMFee) - feeData.networkFee)
          : 0;
    }

    return feeData;
  }
);
