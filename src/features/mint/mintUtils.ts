import { RenNetwork } from "@renproject/interfaces";
import { GatewaySession, GatewayTransaction } from "@renproject/ren-tx";
import {
  BridgeChain,
  BridgeCurrency,
  getChainConfig,
  getChainConfigByRentxName,
  getChainRentxName,
  getCurrencyConfig,
  getCurrencyConfigByRentxName,
  getCurrencyRentxName,
  getCurrencyRentxSourceChain,
  getNetworkConfigByRentxName,
  toMintedCurrency,
} from "../../utils/assetConfigs";
import {
  DepositEntryStatus,
  DepositMeta,
  DepositPhase,
  getAddressExplorerLink,
  getChainExplorerLink,
  getTxCreationTimestamp,
  isTxExpired,
  TxEntryStatus,
  TxMeta,
  TxPhase,
} from "../transactions/transactionsUtils";

type CreateMintTransactionParams = {
  amount: number;
  currency: BridgeCurrency;
  mintedCurrency: BridgeCurrency; // TODO: Can be probably derived from mintedCurrencyChain
  mintedCurrencyChain: BridgeChain;
  userAddress: string;
  destAddress: string;
  network: RenNetwork;
};

export const createMintTransaction = ({
  amount,
  currency,
  mintedCurrencyChain,
  userAddress,
  destAddress,
  network,
}: CreateMintTransactionParams) => {
  // Providing a nonce manually prevents us from needing to instantiate the mint-machine just for that purpose
  // It does not need to be truely random, because it is already limited by destination address
  const nonce = Math.floor(Math.random() * 10 ** 16);
  const tx: GatewaySession = {
    id: "tx-" + nonce,
    type: "mint",
    network,
    sourceAsset: getCurrencyRentxName(currency),
    sourceChain: getCurrencyRentxSourceChain(currency), // TODO: it can be derived for minting
    destAddress,
    destChain: getChainRentxName(mintedCurrencyChain),
    targetAmount: Number(amount),
    userAddress,
    nonce: nonce.toString(16).padEnd(64, "0"),
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

export const depositSorter = (a: GatewayTransaction, b: GatewayTransaction) => {
  const aConf = a.detectedAt || 0;
  const bConf = b.detectedAt || 0;
  return Number(aConf) - Number(bConf);
};

export const getDepositParams = (
  tx: GatewaySession,
  transaction: GatewayTransaction | null
) => {
  const { lockChainConfig, mintChainConfig } = getLockAndMintBasicParams(tx);
  let mintTxHash: string = "";
  let mintTxLink: string = "";
  if (transaction && transaction.destTxHash) {
    mintTxHash = transaction.destTxHash;
    mintTxLink =
      getChainExplorerLink(
        mintChainConfig.symbol,
        tx.network,
        transaction.destTxHash || ""
      ) || "";
  }
  let lockTxHash: string = "";
  let lockTxLink: string = "";
  let lockTxAmount = 0;
  let lockProcessingTime = null;
  let lockConfirmations = 0;
  let lockTargetConfirmations = 0;
  if (transaction) {
    lockTxAmount = transaction.sourceTxAmount / 1e8;
    if (transaction.rawSourceTx) {
      lockTxHash = transaction.rawSourceTx.transaction.txHash;
      lockTxLink =
        getChainExplorerLink(lockChainConfig.symbol, tx.network, lockTxHash) ||
        "";
    }
    lockConfirmations = transaction.sourceTxConfs;
    if (transaction.sourceTxConfTarget) {
      lockTargetConfirmations = transaction.sourceTxConfTarget;
      lockProcessingTime =
        Math.max(lockTargetConfirmations - lockConfirmations, 0) *
        lockChainConfig.blockTime;
    }
  }
  const meta: DepositMeta = {
    status: DepositEntryStatus.PENDING,
    phase: DepositPhase.NONE,
  };

  if (lockTxHash) {
    // it has lockTxHash - there is deposit
    if (mintTxHash) {
      // mint tx hash present - completed
      meta.status = DepositEntryStatus.COMPLETED;
    } else if (lockConfirmations >= lockTargetConfirmations) {
      // no mint tx hash, but confirmations fulfilled
      meta.status = DepositEntryStatus.ACTION_REQUIRED;
      meta.phase = DepositPhase.MINT;
      // expired in mint phase - no submission
      if (isTxExpired(tx)) {
        meta.status = DepositEntryStatus.EXPIRED;
      }
    } else if (lockConfirmations < lockTargetConfirmations) {
      // no mint tx hash, but awaiting confirmations
      meta.status = DepositEntryStatus.PENDING;
      meta.phase = DepositPhase.LOCK;
      if (isTxExpired(tx)) {
        meta.status = DepositEntryStatus.EXPIRED;
      }
    }
  } else {
    // no deposit
    meta.status = DepositEntryStatus.ACTION_REQUIRED;
    meta.phase = DepositPhase.LOCK;
    // expired in lock phase - no deposit
    if (isTxExpired(tx)) {
      meta.status = DepositEntryStatus.EXPIRED;
    }
  }
  return {
    mintTxHash,
    mintTxLink,
    lockTxHash,
    lockTxLink,
    lockConfirmations,
    lockTargetConfirmations,
    lockProcessingTime,
    lockTxAmount,
    meta,
  };
};

export const getLockAndMintBasicParams = (tx: GatewaySession) => {
  const networkConfig = getNetworkConfigByRentxName(tx.network);
  const lockCurrencyConfig = getCurrencyConfigByRentxName(tx.sourceAsset);
  const mintCurrencyConfig = getCurrencyConfig(
    toMintedCurrency(lockCurrencyConfig.symbol)
  );
  const lockChainConfig = getChainConfig(lockCurrencyConfig.sourceChain);
  const mintChainConfig = getChainConfigByRentxName(tx.destChain);
  const mintAddressLink = getAddressExplorerLink(
    mintChainConfig.symbol,
    tx.network,
    tx.userAddress
  );
  const suggestedAmount = Number(tx.suggestedAmount) / 1e8;
  const createdTime = getTxCreationTimestamp(tx);

  return {
    networkConfig,
    lockCurrencyConfig,
    mintCurrencyConfig,
    mintChainConfig,
    lockChainConfig,
    mintAddressLink,
    suggestedAmount,
    createdTime,
  };
};

export const getLockAndMintDepositsParams = (tx: GatewaySession) => {
  const sortedTransactions = Object.values(tx.transactions).sort(depositSorter);
  const depositsParams = [];
  for (const transaction of sortedTransactions) {
    const params = getDepositParams(tx, transaction);
    depositsParams.push(params);
  }
  return { depositsParams };
};

// TODO: deprecated method, replace with getLockAndMintBasicParams, getLockAndMintDepositsParams
export const getLockAndMintParams = (
  tx: GatewaySession,
  depositSourceHash = ""
) => {
  const {
    networkConfig,
    mintCurrencyConfig,
    lockCurrencyConfig,
    mintChainConfig,
    lockChainConfig,
    mintAddressLink,
  } = getLockAndMintBasicParams(tx);

  const sortedDeposits = Object.values(tx.transactions).sort(depositSorter);
  let transaction = null;
  if (sortedDeposits.length) {
    if (depositSourceHash) {
      transaction = tx.transactions[depositSourceHash];
    } else {
      transaction = sortedDeposits[0];
    }
  }
  let mintTxHash: string = "";
  let mintTxLink: string = "";
  if (transaction && transaction.destTxHash) {
    mintTxHash = transaction.destTxHash;
    mintTxLink =
      getChainExplorerLink(
        mintChainConfig.symbol,
        tx.network,
        transaction.destTxHash || ""
      ) || "";
  }
  let lockTxHash: string = "";
  let lockTxLink: string = "";
  let lockTxAmount = 0;
  let lockProcessingTime = null;
  let lockConfirmations = 0;
  let lockTargetConfirmations = 0;
  if (transaction) {
    lockTxAmount = transaction.sourceTxAmount / 1e8;
    if (transaction.rawSourceTx) {
      lockTxHash = transaction.rawSourceTx.transaction.txHash;
      lockTxLink =
        getChainExplorerLink(lockChainConfig.symbol, tx.network, lockTxHash) ||
        "";
    }
    lockConfirmations = transaction.sourceTxConfs;
    if (transaction.sourceTxConfTarget) {
      lockTargetConfirmations = transaction.sourceTxConfTarget;
      lockProcessingTime =
        Math.max(lockTargetConfirmations - lockConfirmations, 0) *
        lockChainConfig.blockTime;
    }
  }
  const meta: TxMeta = {
    status: TxEntryStatus.PENDING,
    phase: TxPhase.NONE,
    createdTimestamp: getTxCreationTimestamp(tx), // TODO: deprecated
    transactionsCount: sortedDeposits.length,
  };

  if (lockTxHash) {
    // it has lockTxHash - there is deposit
    if (mintTxHash) {
      // mint tx hash present - completed
      meta.status = TxEntryStatus.COMPLETED;
    } else if (lockConfirmations >= lockTargetConfirmations) {
      // no mint tx hash, but confirmations fulfilled
      meta.status = TxEntryStatus.ACTION_REQUIRED;
      meta.phase = TxPhase.MINT;
      // expired in mint phase - no submission
      if (isTxExpired(tx)) {
        meta.status = TxEntryStatus.EXPIRED;
      }
    } else if (lockConfirmations < lockTargetConfirmations) {
      // no mint tx hash, but awaiting confirmations
      meta.status = TxEntryStatus.PENDING;
      meta.phase = TxPhase.LOCK;
      if (isTxExpired(tx)) {
        meta.status = TxEntryStatus.EXPIRED;
      }
    }
  } else {
    // no deposit
    meta.status = TxEntryStatus.ACTION_REQUIRED;
    meta.phase = TxPhase.LOCK;
    // expired in lock phase - no deposit
    if (isTxExpired(tx)) {
      meta.status = TxEntryStatus.EXPIRED;
    }
  }

  return {
    networkConfig,
    mintCurrencyConfig,
    lockCurrencyConfig,
    mintChainConfig,
    lockChainConfig,
    mintAddressLink,
    mintTxHash,
    mintTxLink,
    lockTxHash,
    lockTxLink,
    lockConfirmations,
    lockTargetConfirmations,
    lockProcessingTime,
    lockTxAmount,
    suggestedAmount: Number(tx.suggestedAmount) / 1e8,
    meta,
  };
};

export const areAllDepositsCompleted = (tx: GatewaySession) => {
  const { depositsParams } = getLockAndMintDepositsParams(tx);
  for (const deposit of depositsParams) {
    // if any of the deposits is in not in completed state
    if (deposit.meta.status !== DepositEntryStatus.COMPLETED) {
      return false;
    }
  }
  return true;
};

export const isMintTransactionCompleted = (tx: GatewaySession) => {
  const allDepositsCompleted = areAllDepositsCompleted(tx);
  const txExpired = isTxExpired(tx);
  return allDepositsCompleted || txExpired;
};
