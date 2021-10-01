import { RenNetwork } from "@renproject/interfaces";
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  BridgeCurrency,
  getCurrencyConfig,
  isMainnetNetwork,
  isTestnetNetwork,
} from "../../utils/assetConfigs";
import { $renNetwork, setRenNetwork } from "../network/networkSlice";
import { useSelectedChainWallet } from "../wallet/walletHooks";
import { $multiwalletChain } from "../wallet/walletSlice";
import {
  setCurrentSessionDepositHash,
  setCurrentSessionTxId,
} from "./transactionsSlice";

export const useTransactionMenuControl = () => {
  const { walletConnected } = useSelectedChainWallet();

  const [menuOpened, setMenuOpened] = useState(false);
  const handleMenuClose = useCallback(() => {
    setMenuOpened(false);
  }, []);
  const handleMenuOpen = useCallback(() => {
    if (walletConnected) {
      setMenuOpened(true);
    }
  }, [walletConnected]);

  return { menuOpened, handleMenuOpen, handleMenuClose };
};

export const useRenNetworkTracker = (currency: BridgeCurrency) => {
  const dispatch = useDispatch();
  const renChain = useSelector($multiwalletChain);
  const renNetwork = useSelector($renNetwork);

  useEffect(() => {
    const currencyConfig = getCurrencyConfig(currency);
    const networkMapping = currencyConfig.networkMappings[renChain];
    let newNetwork: RenNetwork | null = null;
    if (isTestnetNetwork(renNetwork)) {
      newNetwork = networkMapping.testnet;
    } else if (isMainnetNetwork(renNetwork)) {
      newNetwork = networkMapping.mainnet;
    } else {
      console.error(`Unknown network ${newNetwork}`);
    }
    if (newNetwork && renNetwork !== newNetwork) {
      dispatch(setRenNetwork(newNetwork));
    }
  }, [dispatch, renChain, currency, renNetwork]);
};

export const useSetCurrentSessionData = (txId: string, depositHash = "") => {
  const dispatch = useDispatch();
  dispatch(setCurrentSessionTxId(txId));
  dispatch(setCurrentSessionDepositHash(depositHash));
};
