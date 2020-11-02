import {
  Box,
  Checkbox,
  Divider,
  FormControlLabel,
  IconButton,
  Typography,
} from "@material-ui/core";
import React, {
  FunctionComponent,
  useCallback,
  useMemo,
  useState,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  ActionButton,
  ActionButtonWrapper,
} from "../../../components/buttons/Buttons";
import { NumberFormatText } from "../../../components/formatting/NumberFormatText";
import { getCurrencyGreyIcon } from "../../../components/icons/IconHelpers";
import { BackArrowIcon } from "../../../components/icons/RenIcons";
import { CheckboxWrapper } from "../../../components/inputs/InputHelpers";
import {
  PaperActions,
  PaperContent,
  PaperHeader,
  PaperNav,
  PaperTitle,
} from "../../../components/layout/Paper";
import { TooltipWithIcon } from "../../../components/tooltips/TooltipWithIcon";
import {
  AssetInfo,
  LabelWithValue,
} from "../../../components/typography/TypographyHelpers";
import { MINT_GAS_UNIT_COST } from "../../../constants/constants";
import { getMintedCurrencySymbol } from "../../../providers/multiwallet/multiwalletUtils";
import { getCurrencyShortLabel } from "../../../utils/labels";
import { setFlowStep } from "../../flow/flowSlice";
import { FlowStep } from "../../flow/flowTypes";
import { useGasPrices } from "../../marketData/marketDataHooks";
import {
  $ethUsdExchangeRate,
  $gasPrices,
} from "../../marketData/marketDataSlice";
import {
  $mint,
  $mintCurrencyUsdAmount,
  $mintCurrencyUsdRate,
  $mintFees,
} from "../mintSlice";

export const MintFeesStep: FunctionComponent = () => {
  useGasPrices();
  const dispatch = useDispatch();
  const { amount, currency } = useSelector($mint);
  const currencyUsdRate = useSelector($mintCurrencyUsdRate);
  const ethUsdRate = useSelector($ethUsdExchangeRate);
  const amountUsd = useSelector($mintCurrencyUsdAmount);
  const { renVMFee, conversionTotal, networkFee } = useSelector($mintFees);
  const gasPrices = useSelector($gasPrices);
  const renVMFeeAmountUsd = amountUsd * renVMFee;
  const renVMFeePercents = renVMFee * 100;
  const mintedCurrencySymbol = getMintedCurrencySymbol(currency); // selector?
  const mintedCurrency = getCurrencyShortLabel(mintedCurrencySymbol);
  const mintedCurrencyAmountUsd = conversionTotal * currencyUsdRate;
  const networkFeeUsd = networkFee * currencyUsdRate;
  // TODO: resolve dynamically
  const targetNetworkLabel = "Ethereum";

  const MintedCurrencyIcon = useMemo(
    () => getCurrencyGreyIcon(mintedCurrencySymbol),
    [mintedCurrencySymbol]
  );

  const [ackChecked, setAckChecked] = useState(false);

  const handlePreviousStepClick = useCallback(() => {
    dispatch(setFlowStep(FlowStep.INITIAL));
  }, [dispatch]);
  const handleAckCheckboxChange = useCallback((event) => {
    setAckChecked(event.target.checked);
  }, []);

  const feeInGwei = Math.ceil(MINT_GAS_UNIT_COST * gasPrices.standard);
  const targetNetworkFeeUsd = (feeInGwei / 10 ** 9) * ethUsdRate;
  const targetNetworkFeeLabel = `${feeInGwei} Gwei`;
  console.log(targetNetworkFeeUsd);

  return (
    <>
      <PaperHeader>
        <PaperNav>
          <IconButton onClick={handlePreviousStepClick}>
            <BackArrowIcon />
          </IconButton>
        </PaperNav>
        <PaperTitle>Fees & Confirm</PaperTitle>
        <PaperActions />
      </PaperHeader>
      <PaperContent bottomPadding>
        <Typography variant="body1" gutterBottom>
          Details
        </Typography>
        <LabelWithValue
          label="Sending"
          value={<NumberFormatText value={amount} spacedSuffix={currency} />}
          valueEquivalent={
            <NumberFormatText
              value={amountUsd}
              spacedSuffix="USD"
              decimalScale={2}
              fixedDecimalScale
            />
          }
        />
        <LabelWithValue label="To" value={targetNetworkLabel} />
        <Box mb={1}>
          <Divider />
        </Box>
        <Typography variant="body1" gutterBottom>
          Fees
        </Typography>
        <LabelWithValue
          label="RenVM Fee"
          labelTooltip="Explaining RenVM Fee"
          value={<NumberFormatText value={renVMFeePercents} suffix="%" />}
          valueEquivalent={
            <NumberFormatText
              value={renVMFeeAmountUsd}
              prefix="$"
              decimalScale={2}
              fixedDecimalScale
            />
          }
        />
        <LabelWithValue
          label="Bitcoin Miner Fee"
          labelTooltip="Explaining Bitcoin Miner Fee"
          value={
            <NumberFormatText value={networkFee} spacedSuffix={currency} />
          }
          valueEquivalent={
            <NumberFormatText
              value={networkFeeUsd}
              prefix="$"
              decimalScale={2}
              fixedDecimalScale
            />
          }
        />
        <LabelWithValue
          label="Esti. Ethereum Fee"
          labelTooltip="Explaining Esti. Ethereum Fee"
          value={targetNetworkFeeLabel}
          valueEquivalent={
            <NumberFormatText
              value={targetNetworkFeeUsd}
              prefix="$"
              decimalScale={2}
              fixedDecimalScale
            />
          }
        />
      </PaperContent>
      <Divider />
      <PaperContent topPadding bottomPadding>
        <AssetInfo
          label="Receiving:"
          value={
            <NumberFormatText
              value={conversionTotal}
              spacedSuffix={mintedCurrency}
              decimalScale={3}
            />
          }
          valueEquivalent={
            <NumberFormatText
              prefix=" = $"
              value={mintedCurrencyAmountUsd}
              spacedSuffix="USD"
              decimalScale={2}
              fixedDecimalScale
            />
          }
          Icon={<MintedCurrencyIcon fontSize="inherit" />}
        />
        <CheckboxWrapper>
          <FormControlLabel
            control={
              <Checkbox
                checked={ackChecked}
                onChange={handleAckCheckboxChange}
                name="primary"
                color="primary"
              />
            }
            label={
              <Typography variant="caption">
                I acknowledge this transaction requires ETH{" "}
                <TooltipWithIcon title="Explanation" />
              </Typography>
            }
          />
        </CheckboxWrapper>
        <ActionButtonWrapper>
          <ActionButton>Next</ActionButton>
        </ActionButtonWrapper>
      </PaperContent>
    </>
  );
};
