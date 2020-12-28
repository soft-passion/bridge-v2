import { GatewaySession } from "@renproject/ren-tx";
import { FunctionComponent, useEffect } from "react";
import { useBurnMachine } from "../releaseHooks";

export const releaseTooltips = {
  releasing: "The amount and asset you're releasing before fees are applied.",
  from: "The blockchain you are releasing the asset from.",
  to: "The wallet address you're receiving the assets to.",
};

type BurnAndReleaseTransactionInitializerProps = {
  initialTx: GatewaySession;
  onCreated?: (tx: GatewaySession) => void;
};

export const BurnAndReleaseTransactionInitializer: FunctionComponent<BurnAndReleaseTransactionInitializerProps> = ({
  initialTx,
  onCreated,
}) => {
  const [current, , service] = useBurnMachine(initialTx);
  useEffect(
    () => () => {
      service.stop();
    },
    [service]
  );
  useEffect(() => {
    if (onCreated && current.value === "created") {
      onCreated(current.context.tx);
    }
  }, [onCreated, current.value, current.context.tx]);

  return null;
};
