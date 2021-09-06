import {
  ButtonBase,
  ButtonProps,
  Fade,
  lighten,
  makeStyles,
  styled,
  Theme,
  Typography,
  useMediaQuery,
  useTheme,
  withStyles,
} from "@material-ui/core";
import {
  ToggleButton,
  ToggleButtonGroup,
  ToggleButtonGroupProps,
} from "@material-ui/lab";
import { GatewaySession } from "@renproject/ren-tx";
import classNames from "classnames";
import React, { FunctionComponent } from "react";
import { useTranslation } from "react-i18next";
import {
  CompletedIcon,
  EmptyIcon,
  GatewayIcon,
  NavigateNextIcon,
  NavigatePrevIcon,
} from "../../../components/icons/RenIcons";
import {
  ProgressWithContent,
  ProgressWithContentProps,
  PulseIndicator,
} from "../../../components/progress/ProgressHelpers";
import { BridgeChainConfig } from "../../../utils/assetConfigs";
import { HMSCountdown } from "../../transactions/components/TransactionsHelpers";
import {
  DepositEntryStatus,
  DepositPhase,
} from "../../transactions/transactionsUtils";
import {
  depositSorter,
  getDepositParams,
  getLockAndMintBasicParams,
  getRemainingGatewayTime,
} from "../mintUtils";

const useBigNavButtonStyles = makeStyles((theme) => ({
  root: {
    color: theme.palette.primary.main,
    fontSize: 90,
    transition: "all 1s",
    display: "inline-flex",
    cursor: "pointer",
    "&:hover": {
      color: theme.palette.primary.dark,
    },
  },
  disabled: {
    opacity: 0.2,
    cursor: "default",
  },
  hidden: {
    display: "none",
    opacity: 0,
  },
}));

type BigNavButtonProps = ButtonProps & {
  direction: "next" | "prev";
};
export const BigNavButton: FunctionComponent<BigNavButtonProps> = ({
  direction,
  disabled,
  hidden,
  className,
  onClick,
}) => {
  const styles = useBigNavButtonStyles();
  const rootClassName = classNames(styles.root, className, {
    [styles.disabled]: disabled,
    [styles.hidden]: hidden,
  });
  const Icon = direction === "prev" ? NavigatePrevIcon : NavigateNextIcon;
  return (
    <ButtonBase className={rootClassName} disabled={disabled} onClick={onClick}>
      <Icon fontSize="inherit" />
    </ButtonBase>
  );
};

export const BigPrevButton: FunctionComponent<ButtonProps> = (props) => (
  <BigNavButton direction="prev" {...props} />
);

export const BigNextButton: FunctionComponent<ButtonProps> = (props) => (
  <BigNavButton direction="next" {...props} />
);

const offsetTop = 38;
const offsetHorizontal = -42;
export const DepositPrevButton = styled(BigPrevButton)({
  position: "absolute",
  top: offsetTop,
  left: offsetHorizontal,
});

export const DepositNextButton = styled(BigNextButton)({
  position: "absolute",
  top: offsetTop,
  right: offsetHorizontal,
});

type CircledIconContainerProps = {
  background?: string;
  color?: string;
  opacity?: number;
  size?: number;
  className?: string;
};

const depositsBreakpoint = "md";
const transition = "all 1s ease-out";

const useCircledIconContainerStyles = makeStyles<
  Theme,
  CircledIconContainerProps
>((theme) => ({
  root: {
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: ({ size }) => size,
    width: ({ size }) => size,
    backgroundColor: ({ background = theme.palette.grey[400], opacity = 1 }) =>
      opacity !== 1 ? lighten(background, 1 - opacity) : background,
    color: ({ color = "inherit" }) => color,
  },
}));

export const CircledIconContainer: FunctionComponent<CircledIconContainerProps> = ({
  background,
  color,
  size = 54,
  opacity,
  className,
  children,
}) => {
  const styles = useCircledIconContainerStyles({
    size,
    background,
    color,
    opacity,
  });

  return <div className={classNames(styles.root, className)}>{children}</div>;
};

export const DepositToggleButton = withStyles((theme) => ({
  root: {
    transition,
    background: theme.palette.common.white,
    padding: `2px 15px 2px 15px`,
    [theme.breakpoints.up(depositsBreakpoint)]: {
      padding: 12,
      minWidth: 240,
      textAlign: "left",
      boxShadow: `0px 1px 3px rgba(0, 27, 58, 0.05)`,
      border: `2px solid ${theme.palette.common.white}!important`,
      "&:hover": {
        background: theme.palette.common.white,
        border: `2px solid ${theme.palette.primary.main}!important`,
      },
    },
    [theme.breakpoints.up("lg")]: {
      minWidth: 280,
    },
    "&:first-child": {
      paddingLeft: 2,
      marginRight: 1,
      [theme.breakpoints.up(depositsBreakpoint)]: {
        paddingLeft: 12,
        marginRight: 0,
      },
    },
    "&:last-child": {
      paddingRight: 2,
      [theme.breakpoints.up(depositsBreakpoint)]: {
        paddingRight: 12,
      },
    },
  },
  selected: {
    [theme.breakpoints.up(depositsBreakpoint)]: {
      background: `${theme.palette.common.white}!important`,
      border: `2px solid ${theme.palette.primary.main}!important`,
    },
  },
  label: {
    [theme.breakpoints.up(depositsBreakpoint)]: {
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-start",
    },
  },
}))(ToggleButton);

export const DepositIndicator: FunctionComponent = () => {
  const theme = useTheme();
  return (
    <CircledIconContainer
      size={42}
      background={theme.palette.common.black}
      color={theme.palette.grey[200]}
    >
      <GatewayIcon fontSize="large" color="inherit" />
    </CircledIconContainer>
  );
};

const useCircledProgressWithContentStyles = makeStyles({
  container: {
    position: "relative",
  },
  indicator: {
    position: "absolute",
    top: "8%",
    right: "8%",
  },
});

type CircledProgressWithContentProps = ProgressWithContentProps & {
  indicator?: boolean;
};

export const CircledProgressWithContent: FunctionComponent<CircledProgressWithContentProps> = ({
  color,
  size = 42,
  indicator = false,
  ...rest
}) => {
  const styles = useCircledProgressWithContentStyles();
  return (
    <CircledIconContainer
      background={color}
      opacity={0.1}
      size={Math.floor(1.28 * size)}
      className={styles.container}
    >
      <ProgressWithContent color={color} size={size} {...rest} />
      {indicator && <PulseIndicator className={styles.indicator} pulsing />}
    </CircledIconContainer>
  );
};

type DepositNavigationProps = ToggleButtonGroupProps & {
  tx: GatewaySession<any>;
};

export const DepositNavigationResolver: FunctionComponent<DepositNavigationProps> = (
  props
) => {
  const theme = useTheme();
  const desktop = useMediaQuery(theme.breakpoints.up("md"));
  return (
    <>
      {/*<Fade in={!desktop}>*/}
      {/*  <MobileDepositNavigation {...props} />*/}
      {/*</Fade>*/}
      <Fade in={desktop}>
        <ResponsiveDepositNavigation {...props} />
      </Fade>
    </>
  );
};

const useMobileDepositNavigationStyles = makeStyles({
  root: {
    position: "absolute",
    left: 0,
    right: 0,
    top: -152,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
});

const StyledToggleButtonGroup = withStyles((theme) => ({
  root: {
    transition,
    [theme.breakpoints.up(depositsBreakpoint)]: {
      background: theme.customColors.whiteDarker,
      borderRadius: 20,
    },
  },
  grouped: {
    transition,
    [theme.breakpoints.up(depositsBreakpoint)]: {
      marginBottom: 16,
      border: "none",
      "&:first-child": {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
      },
      "&:not(:first-child)": {
        borderRadius: 46,
        marginLeft: 12,
        marginRight: 12,
      },
    },
  },
}))(ToggleButtonGroup);

const useResponsiveDepositNavigationStyles = makeStyles((theme) => ({
  root: {
    transition,
    position: "absolute",
    left: 0,
    right: 0,
    top: -152,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    [theme.breakpoints.up(depositsBreakpoint)]: {
      display: "block",
      top: -72,
      left: 390,
    },
  },
}));

const useMoreInfoStyles = makeStyles((theme) => ({
  root: {
    display: "none",
    marginLeft: 12,
    [theme.breakpoints.up(depositsBreakpoint)]: {
      display: "flex",
    },
  },
  gateway: {
    marginLeft: 23,
  },
}));

type MoreInfoProps = {
  gateway?: boolean;
};

const MoreInfo: FunctionComponent<MoreInfoProps> = ({ gateway, children }) => {
  const styles = useMoreInfoStyles();
  const className = classNames(styles.root, {
    [styles.gateway]: gateway,
  });
  return <div className={className}>{children}</div>;
};

export const ResponsiveDepositNavigation: FunctionComponent<DepositNavigationProps> = ({
  value,
  onChange,
  tx,
}) => {
  const { t } = useTranslation();
  const styles = useResponsiveDepositNavigationStyles();
  const theme = useTheme();
  const mobile = !useMediaQuery(theme.breakpoints.up(depositsBreakpoint));

  const sortedDeposits = Object.values(tx.transactions).sort(depositSorter);

  const { lockChainConfig, mintChainConfig } = getLockAndMintBasicParams(tx);

  return (
    <div className={styles.root}>
      <StyledToggleButtonGroup
        exclusive
        size="large"
        onChange={onChange}
        value={value}
        orientation={mobile ? "horizontal" : "vertical"}
      >
        <DepositToggleButton value="gateway">
          <CircledIconContainer>
            <DepositIndicator />
          </CircledIconContainer>
          <MoreInfo gateway>
            <div>
              <Typography variant="body1" color="textPrimary">
                Gateway Address
              </Typography>
              <Typography variant="body2">
                {t("mint.deposit-navigation-active-for-label")}:{" "}
                <Typography variant="body2" component="span" color="primary">
                  <HMSCountdown
                    milliseconds={getRemainingGatewayTime(tx.expiryTime)}
                  />
                </Typography>
              </Typography>
            </div>
          </MoreInfo>
        </DepositToggleButton>
        {sortedDeposits.map((deposit) => {
          const hash = deposit.sourceTxHash;
          const { lockCurrencyConfig } = getLockAndMintBasicParams(tx);

          const {
            lockConfirmations,
            lockTargetConfirmations,
            lockTxAmount,
            depositStatus,
            depositPhase,
          } = getDepositParams(tx, deposit);
          const StatusIcon = getDepositStatusIcon({
            depositStatus,
            depositPhase,
            mintChainConfig,
            lockChainConfig,
          });
          const isProcessing = depositPhase === DepositPhase.NONE;
          const requiresAction =
            depositStatus === DepositEntryStatus.ACTION_REQUIRED;
          const completed = depositStatus === DepositEntryStatus.COMPLETED;
          const isPendingConfirmations =
            lockConfirmations < lockTargetConfirmations;
          const confirmationProps = completed
            ? {}
            : {
                confirmations: lockConfirmations,
                targetConfirmations: lockTargetConfirmations,
              };

          let InfoContent: any = null;
          if (depositStatus === DepositEntryStatus.COMPLETED) {
            InfoContent = (
              <div>
                <Typography variant="body1" color="textPrimary">
                  {lockTxAmount} {lockCurrencyConfig.short}
                </Typography>
                <Typography variant="body2" color="primary">
                  {t("mint.deposit-navigation-completed-label")}
                </Typography>
              </div>
            );
          } else if (depositStatus === DepositEntryStatus.PENDING) {
            InfoContent = (
              <div>
                <Typography variant="body1" color="textPrimary">
                  {lockTxAmount} {lockCurrencyConfig.short}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {t("mint.deposit-navigation-confirmations-label", {
                    confirmations: lockConfirmations,
                    targetConfirmations: lockTargetConfirmations,
                  })}
                </Typography>
              </div>
            );
          } else if (depositStatus === DepositEntryStatus.ACTION_REQUIRED) {
            InfoContent = (
              <div>
                <Typography variant="body1" color="textPrimary">
                  {lockTxAmount} {lockCurrencyConfig.short}
                </Typography>
                <Typography variant="body2" color="primary">
                  {t("mint.deposit-navigation-mint-ready-label")}
                </Typography>
              </div>
            );
          }

          const Info = () => InfoContent;
          return (
            <DepositToggleButton key={hash} value={hash}>
              <CircledProgressWithContent
                color={
                  completed ? theme.customColors.blue : lockCurrencyConfig.color
                }
                {...confirmationProps}
                processing={isProcessing}
                indicator={requiresAction}
              >
                <StatusIcon fontSize="large" />
              </CircledProgressWithContent>
              <MoreInfo>
                <Info />
              </MoreInfo>
            </DepositToggleButton>
          );
        })}
      </StyledToggleButtonGroup>
    </div>
  );
};

type GetDepositStatusIconFnParams = {
  depositStatus: DepositEntryStatus;
  depositPhase: DepositPhase;
  lockChainConfig: BridgeChainConfig;
  mintChainConfig: BridgeChainConfig;
};

export const getDepositStatusIcon = ({
  depositStatus,
  depositPhase,
  lockChainConfig,
  mintChainConfig,
}: GetDepositStatusIconFnParams) => {
  let StatusIcon = EmptyIcon;
  if (depositStatus === DepositEntryStatus.COMPLETED) {
    StatusIcon = CompletedIcon;
  } else if (depositPhase === DepositPhase.LOCK) {
    StatusIcon = lockChainConfig.Icon;
  } else if (depositPhase === DepositPhase.MINT) {
    StatusIcon = mintChainConfig.Icon;
  }
  return StatusIcon;
};
