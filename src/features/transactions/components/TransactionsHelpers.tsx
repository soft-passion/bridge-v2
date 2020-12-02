import { Button, Chip, styled, Typography, useTheme } from "@material-ui/core";
import { GatewaySession } from "@renproject/ren-tx";
import React, {
  FunctionComponent,
  useCallback,
  useEffect,
  useState,
} from "react";
import {
  ActionButton,
  ActionButtonWrapper,
} from "../../../components/buttons/Buttons";
import { PaperContent } from "../../../components/layout/Paper";
import { Link } from "../../../components/links/Links";
import { NestedDrawer } from "../../../components/modals/BridgeModal";
import {
  ProgressWithContent,
  ProgressWrapper,
  TransactionStatusIndicator,
  TransactionStatusInfo,
} from "../../../components/progress/ProgressHelpers";
import { useTransactionEntryStyles } from "../../../components/transactions/TransactionsGrid";
import { Debug } from "../../../components/utils/Debug";
import { usePaperTitle } from "../../../pages/MainPage";
import { getLockAndMintParams, useMintMachine } from "../../mint/mintUtils";
import { TxEntryStatus } from "../transactionsUtils";

export const ProcessingTimeWrapper = styled("div")({
  marginTop: 5,
  marginBottom: 5,
});

export const SpacedPaperContent = styled(PaperContent)({
  minHeight: 200,
});

type BookmarkPageWarningProps = {
  onClosed?: () => void;
};

export const BookmarkPageWarning: FunctionComponent<BookmarkPageWarningProps> = ({
  onClosed,
}) => {
  const [open, setOpen] = useState(true);
  const handleClose = useCallback(() => {
    if (onClosed) {
      onClosed();
    }
    setOpen(false);
  }, [onClosed]);
  return (
    <NestedDrawer title="Warning" open={open} onClose={handleClose}>
      <SpacedPaperContent topPadding bottomPadding>
        <Typography variant="h5" align="center" gutterBottom>
          Bookmark this page
        </Typography>
        <Typography variant="body2" align="center" gutterBottom>
          To ensure you don’t lose track of your transaction, please bookmark
          this page.
        </Typography>
      </SpacedPaperContent>
      <PaperContent bottomPadding>
        <ActionButtonWrapper>
          <ActionButton onClick={handleClose}>I understand</ActionButton>
        </ActionButtonWrapper>
      </PaperContent>
    </NestedDrawer>
  );
};

type EnableNotificationsWarningProps = {
  onClosed?: () => void;
};

export const EnableNotificationsWarning: FunctionComponent<EnableNotificationsWarningProps> = ({
  onClosed,
}) => {
  const [open, setOpen] = useState(true);
  const handleClose = useCallback(() => {
    if (onClosed) {
      onClosed();
    }
    setOpen(false);
  }, [onClosed]);
  return (
    <NestedDrawer title="Warning" open={open} onClose={handleClose}>
      <SpacedPaperContent topPadding bottomPadding>
        <Typography variant="h5" align="center" gutterBottom>
          Bookmark this page
        </Typography>
        <Typography variant="body2" align="center" gutterBottom>
          To ensure you don’t lose track of your transaction, please bookmark
          this page.
        </Typography>
      </SpacedPaperContent>
      <PaperContent bottomPadding>
        <Button variant="text" color="primary">
          Do not enable
        </Button>
        <ActionButtonWrapper>
          <ActionButton onClick={handleClose}>
            Enable Browser Notifications
          </ActionButton>
        </ActionButtonWrapper>
      </PaperContent>
    </NestedDrawer>
  );
};

type ProgressStatusProps = {
  reason?: string;
  processing?: boolean;
};

export const ProgressStatus: FunctionComponent<ProgressStatusProps> = ({
  reason = "Loading...",
  processing = true,
}) => {
  const theme = useTheme();
  const [, setTitle] = usePaperTitle();
  useEffect(() => {
    setTitle(reason);
  }, [setTitle, reason]);
  return (
    <>
      <ProgressWrapper>
        <ProgressWithContent
          processing={processing}
          color={theme.palette.primary.main}
        >
          <TransactionStatusInfo status={reason} />
        </ProgressWithContent>
      </ProgressWrapper>
    </>
  );
};

type TransactionItemProps = {
  tx: GatewaySession;
  onAction?: () => void;
};

export const MintTransactionEntryResolver: FunctionComponent<TransactionItemProps> = ({
  tx,
}) => {
  const { meta } = getLockAndMintParams(tx);
  if (meta.status === TxEntryStatus.COMPLETED) {
    return <MintTransactionEntry tx={tx} />;
  }
  return <MintTransactionEntryMachine tx={tx} />;
};

export const MintTransactionEntryMachine: FunctionComponent<TransactionItemProps> = ({
  tx,
  onAction,
}) => {
  const [initialTx] = useState(tx);
  const [current, , service] = useMintMachine(initialTx);
  useEffect(
    () => () => {
      service.stop();
    },
    [service]
  );

  return <MintTransactionEntry tx={current.context.tx} onAction={onAction} />;
};

export const MintTransactionEntry: FunctionComponent<TransactionItemProps> = ({
  tx,
}) => {
  const styles = useTransactionEntryStyles();
  const {
    lockChainConfig,
    lockConfirmations,
    lockTxAmount,
    lockTxHash,
    lockTxLink,
    lockTargetConfirmations,
    mintCurrencyConfig,
    mintChainConfig,
    mintTxHash,
    mintTxLink,
    meta: { status },
  } = getLockAndMintParams(tx);
  const chainSymbol = lockTxHash
    ? mintChainConfig.symbol
    : lockChainConfig.symbol;
  return (
    <>
      <Debug it={tx} />
      <div className={styles.root}>
        <div className={styles.details}>
          <div className={styles.datetime}>
            <Chip size="small" label="04/02/20" className={styles.date} />
            <Chip size="small" label="23:45:32 UTC" />
          </div>
          <div className={styles.description}>
            <Typography variant="body2">
              Mint {lockTxAmount} {mintCurrencyConfig.short} on{" "}
              {mintChainConfig.full}
            </Typography>
          </div>
          <div className={styles.links}>
            {lockTxLink && (
              <Link
                href={lockTxLink}
                target="_blank"
                external
                color="primary"
                className={styles.link}
              >
                {lockChainConfig.full} transaction
              </Link>
            )}
            {status === TxEntryStatus.ACTION_REQUIRED && (
              <Link
                href={lockTxLink}
                target="_blank"
                color="primary"
                className={styles.link}
              >
                {lockChainConfig.full} transaction
              </Link>
            )}
            {mintTxLink && (
              <Link
                href={mintTxLink}
                target="_blank"
                external
                color="primary"
                className={styles.link}
              >
                {mintChainConfig.full} transaction
              </Link>
            )}
          </div>
        </div>
        <div className={styles.status}>
          <TransactionStatusIndicator
            chain={chainSymbol}
            status={status}
            confirmations={lockConfirmations}
            targetConfirmations={lockTargetConfirmations}
          />
        </div>
      </div>
    </>
  );
};
