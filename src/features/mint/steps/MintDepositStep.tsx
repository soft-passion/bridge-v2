import { Box, Divider, IconButton, Typography } from '@material-ui/core'
import { GatewaySession } from '@renproject/rentx'
import queryString from 'query-string'
import React, { FunctionComponent, useCallback, useEffect, useMemo, } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'
import { CopyContentButton, QrCodeIconButton, ToggleIconButton, } from '../../../components/buttons/Buttons'
import { NumberFormatText } from '../../../components/formatting/NumberFormatText'
import { BackArrowIcon, BitcoinIcon } from '../../../components/icons/RenIcons'
import { PaperActions, PaperContent, PaperHeader, PaperNav, PaperTitle, } from '../../../components/layout/Paper'
import { ProgressWithContent, ProgressWrapper, } from '../../../components/progress/ProgressHelpers'
import {
  BigAssetAmount,
  BigAssetAmountWrapper,
  LabelWithValue,
} from '../../../components/typography/TypographyHelpers'
import { Debug } from '../../../components/utils/Debug'
import { MINT_GAS_UNIT_COST } from '../../../constants/constants'
import { orangeLight } from '../../../theme/colors'
import { getCurrencyShortLabel } from '../../../utils/assetConfigs'
import { fromGwei } from '../../../utils/converters'
import { setFlowStep } from '../../flow/flowSlice'
import { FlowStep } from '../../flow/flowTypes'
import { useGasPrices } from '../../marketData/marketDataHooks'
import { $ethUsdExchangeRate, $gasPrices, } from '../../marketData/marketDataSlice'
import { $currentTx, setCurrentTransaction, } from '../../transactions/transactionsSlice'
import { getTooltips } from '../components/MintHelpers'
import { $mint, $mintCurrencyUsdAmount, $mintCurrencyUsdRate, $mintFees, } from '../mintSlice'
import { preValidateMintTransaction } from '../mintUtils'

export const MintDepositStep: FunctionComponent = () => {
  useGasPrices();
  const dispatch = useDispatch();
  const location = useLocation();
  const { amount, currency } = useSelector($mint);
  const currencyUsdRate = useSelector($mintCurrencyUsdRate);
  const ethUsdRate = useSelector($ethUsdExchangeRate);
  const amountUsd = useSelector($mintCurrencyUsdAmount);
  const { renVMFee, renVMFeeAmount, networkFee } = useSelector($mintFees);
  const gasPrices = useSelector($gasPrices);
  const tx = useSelector($currentTx);
  const renVMFeeAmountUsd = amountUsd * renVMFee;
  const networkFeeUsd = networkFee * currencyUsdRate;

  const tooltips = useMemo(() => getTooltips(renVMFee, 0.001), [renVMFee]); // TODO: CRIT: add release fee from selectors

  const handlePreviousStepClick = useCallback(() => {
    dispatch(setFlowStep(FlowStep.FEES));
  }, [dispatch]);

  const feeInGwei = Math.ceil(MINT_GAS_UNIT_COST * gasPrices.standard);
  const targetNetworkFeeUsd = fromGwei(feeInGwei) * ethUsdRate;
  const targetNetworkFeeLabel = `${feeInGwei} Gwei`;

  useEffect(() => {
    const queryParams = queryString.parse(location.search);
    const tx: GatewaySession = JSON.parse(queryParams.tx as string);
    if (preValidateMintTransaction(tx)) {
      dispatch(setCurrentTransaction(tx)); // TODO: local state?
    }
  }, [dispatch, location.search]);

  const gatewayAddress = "1LU14szcGuMwxVNet1rm"; // TODO: get
  const processingTime = 60; // TODO: get
  return (
    <>
      <PaperHeader>
        <PaperNav>
          <IconButton onClick={handlePreviousStepClick}>
            <BackArrowIcon />
          </IconButton>
        </PaperNav>
        <PaperTitle>Send {getCurrencyShortLabel(currency)}</PaperTitle>
        <PaperActions>
          <ToggleIconButton variant="settings" />
          <ToggleIconButton variant="notifications" />
        </PaperActions>
      </PaperHeader>
      <PaperContent bottomPadding>
        <ProgressWrapper>
          <ProgressWithContent color={orangeLight} size={64}>
            <BitcoinIcon fontSize="inherit" color="inherit" />
          </ProgressWithContent>
        </ProgressWrapper>
        <BigAssetAmountWrapper>
          <BigAssetAmount
            value={
              <span>
                Send <NumberFormatText value={amount} spacedSuffix={currency} />{" "}
                to
              </span>
            }
          />
        </BigAssetAmountWrapper>
        <CopyContentButton content={gatewayAddress} />
        <Box
          mt={2}
          display="flex"
          justifyContent="center"
          flexDirection="column"
          alignItems="center"
        >
          <Typography variant="caption" gutterBottom>
            Estimated processing time: {processingTime} minutes
          </Typography>
          <Box mt={2}>
            <QrCodeIconButton />
          </Box>
        </Box>
      </PaperContent>
      <Divider />
      <PaperContent topPadding bottomPadding>
        <LabelWithValue
          label="RenVM Fee"
          labelTooltip={tooltips.renVmFee}
          value={
            <NumberFormatText value={renVMFeeAmount} spacedSuffix={currency} />
          }
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
          labelTooltip={tooltips.bitcoinMinerFee}
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
          labelTooltip={tooltips.estimatedEthFee}
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
        <Debug it={{ tx }} />
      </PaperContent>
    </>
  );
};
