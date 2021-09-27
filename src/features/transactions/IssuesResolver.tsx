import { Box, DialogContent, Fade, Typography } from "@material-ui/core";
import { makeStyles, styled } from "@material-ui/core/styles";
import React, { FunctionComponent, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import {
  ActionButton,
  ActionButtonWrapper,
  ClosableMenuIconButton,
} from "../../components/buttons/Buttons";
import { SyncProblemIcon } from "../../components/icons/RenIcons";
import { externalLinkAttributes, Link } from "../../components/links/Links";
import { BridgeModalTitle } from "../../components/modals/BridgeModal";
import { Debug } from "../../components/utils/Debug";
import { links } from "../../constants/constants";
import { WideDialog } from "./components/TransactionHistoryHelpers";
import {
  $currentSession,
  $issueResolver,
  setIssueResolverOpened,
} from "./transactionsSlice";
import { getRenExplorerLink } from "./transactionsUtils";

const FundsChip = styled("p")(({ theme }) => ({
  padding: `16px 47px`,
  border: `1px solid ${theme.palette.primary.light}`,
  borderRadius: 20,
  textAlign: "center",
  color: theme.palette.primary.main,
  display: "inline-block",
}));

const useIssueResolverStyles = makeStyles((theme) => ({
  content: {
    textAlign: "center",
  },
  text: {
    maxInlineSize: 370,
  },
}));

const MaxBox = styled("div")({
  maxWidth: 370,
  margin: "0 auto",
});

export const IssuesResolver: FunctionComponent = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { dialogOpened } = useSelector($issueResolver);
  const { data, txId, depositHash } = useSelector($currentSession);
  const styles = useIssueResolverStyles();

  const handleClose = useCallback(() => {
    dispatch(setIssueResolverOpened(false));
  }, [dispatch]);

  const deposit = data?.transactions[depositHash] || {};

  const explorer = getRenExplorerLink("testnet", depositHash);
  return (
    <WideDialog
      open={dialogOpened}
      onEscapeKeyDown={handleClose}
      onBackdropClick={handleClose}
    >
      <BridgeModalTitle onClose={handleClose}>
        {t("tx.issue-resolver-title")}
      </BridgeModalTitle>
      <DialogContent className={styles.content} dividers>
        <MaxBox>
          <Typography variant="body2" gutterBottom>
            {t("tx.issue-resolver-description")}
          </Typography>
          <Box display="flex" justifyContent="center" mb={2}>
            <FundsChip>{t("tx.issue-resolver-funds-label")}</FundsChip>
          </Box>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            {t("tx.issue-resolver-instructions-text")}
          </Typography>
        </MaxBox>
      </DialogContent>
      <DialogContent className={styles.content}>
        <Typography variant="body1" gutterBottom>
          {t("tx.issue-resolver-viewing-deposit-header", { depositHash })}
        </Typography>
        <MaxBox>
          <Typography variant="body2">
            {t("tx.issue-resolver-viewing-deposit-description")}
          </Typography>
        </MaxBox>
        <ActionButtonWrapper>
          <Typography color="textPrimary">
            <Link href={links.REN_EXPLORER_GUIDE} {...externalLinkAttributes}>
              {t("tx.issue-resolver-explorer-guide-label")}
            </Link>
          </Typography>
        </ActionButtonWrapper>
        <ActionButtonWrapper>
          <ActionButton href={explorer} {...externalLinkAttributes}>
            {t("tx.issue-resolver-go-to-explorer-label")}
          </ActionButton>
        </ActionButtonWrapper>
        <ActionButtonWrapper>
          <Typography color="textSecondary" variant="body2">
            {t("tx.issue-resolver-unresolved-text")}{" "}
            <Link href={links.BUGS_LOG} {...externalLinkAttributes}>
              {t("tx.issue-resolver-unresolved-link-text")}
            </Link>
          </Typography>
        </ActionButtonWrapper>
      </DialogContent>
      <Debug it={{ depositHash, deposit, data: data, txId }} />
    </WideDialog>
  );
};

type IssueResolverButtonProps = {
  className?: string;
};

export const IssueResolverButton: FunctionComponent<IssueResolverButtonProps> = ({
  className,
}) => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { dialogOpened: issueResolverOpened } = useSelector($issueResolver);
  const { depositHash } = useSelector($currentSession);
  const handleIssueResolverToggle = useCallback(() => {
    dispatch(setIssueResolverOpened(!issueResolverOpened));
  }, [dispatch, issueResolverOpened]);

  return (
    <Fade in={!!depositHash}>
      <ClosableMenuIconButton
        title={t("tx.issue-resolver-button-title")}
        className={className}
        Icon={SyncProblemIcon}
        opened={issueResolverOpened}
        onClick={handleIssueResolverToggle}
      />
    </Fade>
  );
};
