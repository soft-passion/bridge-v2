import { RenNetwork } from "@renproject/interfaces";
import { useMultiwallet } from "@renproject/multiwallet-ui";
import { GatewaySession, mintMachine } from "@renproject/rentx";
import { useMachine } from "@xstate/react";
import { env } from "../../constants/environmentVariables";
import { getRenJs } from "../../services/renJs";
import { lockChainMap, mintChainMap } from "../../services/rentx";
import {
  BridgeChain,
  BridgeCurrency,
  getChainRentxName,
  getCurrencyRentxName,
  getCurrencyRentxSourceChain,
} from "../../utils/assetConfigs";

export const getMintTx: GatewaySession = {
  id: "tx-" + Math.floor(Math.random() * 10 ** 16),
  type: "mint",
  sourceAsset: "btc",
  sourceNetwork: "bitcoin",
  network: "testnet",
  destAddress: "",
  destNetwork: "ethereum",
  targetAmount: 1,
  userAddress: "",
  expiryTime: new Date().getTime() + 1000 * 60 * 60 * 24,
  transactions: {},
  customParams: {},
};

type CreateMintTransactionParams = {
  amount: number;
  currency: BridgeCurrency;
  mintedCurrency: BridgeCurrency; // TODO: Can be probably derived from mintedCurrencyChain
  mintedCurrencyChain: BridgeChain;
  userAddress: string;
  destAddress: string;
};

export const createMintTransaction = ({
  amount,
  currency,
  mintedCurrencyChain,
  userAddress,
  destAddress,
}: CreateMintTransactionParams) => {
  const tx: GatewaySession = {
    id: "tx-" + Math.floor(Math.random() * 10 ** 16),
    type: "mint",
    network: env.NETWORK as RenNetwork,
    sourceAsset: getCurrencyRentxName(currency),
    sourceNetwork: getCurrencyRentxSourceChain(currency),
    destAddress,
    destNetwork: getChainRentxName(mintedCurrencyChain),
    targetAmount: Number(amount),
    userAddress,
    expiryTime: new Date().getTime() + 1000 * 60 * 60 * 24,
    transactions: {},
    customParams: {},
  };

  return tx;
};

export const preValidateMintTransaction = (tx: GatewaySession) => {
  // TODO: create advancedValidation
  return (
    tx.type === "mint" &&
    tx.destAddress &&
    tx.userAddress &&
    tx.targetAmount > 0
  );
};

export const useMintMachine = (mintTransaction: GatewaySession) => {
  const { enabledChains } = useMultiwallet();
  const providers = Object.entries(enabledChains).reduce(
    (c, n) => ({
      ...c,
      [n[0]]: n[1].provider,
    }),
    {}
  );
  return useMachine(mintMachine, {
    context: {
      tx: mintTransaction,
      providers,
      sdk: getRenJs(),
      fromChainMap: lockChainMap,
      toChainMap: mintChainMap,
    },
    devTools: env.XSTATE_DEVTOOLS,
  });
};
