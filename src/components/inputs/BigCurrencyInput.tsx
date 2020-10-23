import { makeStyles, styled } from '@material-ui/core/styles'
import classNames from "classnames";
import Numeral from "numeral";
import React, { FunctionComponent, useRef } from "react";
import NumberFormat, { NumberFormatValues } from "react-number-format";

const useStyles = makeStyles((theme) => ({
  container: {
    width: "100%",
    textAlign: "center",
    "& input": {
      fontFamily: "inherit",
      color: theme.palette.common.black,
    },
  },
  large: {
    "& input": {
      fontSize: 52,
    },
  },
  medium: {
    "& input": {
      fontSize: 42,
    },
  },
  small: {
    "& input": {
      fontSize: 32,
    },
  },
  smallest: {
    "& input": {
      fontSize: 22,
    },
  },
  input: {
    fontSize: 52,
    width: "100%",
    outline: "none",
    textAlign: "center",
    border: "0px solid transparent",
  },
  equivalent: {
    marginTop: 0,
    color: "#3F3F48",
  },
}));

type NumberChange = (values: NumberFormatValues) => void;

type BigCurrencyInputProps = {
  onChange: (value: any) => void;
  symbol: string;
  usdValue: string | number;
  value: string | number;
  placeholder: string;
};

export const BigCurrencyInput: FunctionComponent<BigCurrencyInputProps> = ({
  onChange,
  symbol,
  usdValue,
  value,
  placeholder,
}) => {
  const styles = useStyles();
  const inputRef = useRef(null);
  const val = value ? String(value) : "";
  // const ref = this.ref;
  const handleChange: NumberChange = (values) => {
    console.log(values);
    onChange(values.value);
  };

  const chars = val.replace(".", "").replace(` ${symbol}`, "");

  let size = "large";
  if (chars.length > 5 && chars.length <= 7) {
    size = "medium";
  } else if (chars.length > 7 && chars.length <= 9) {
    size = "small";
  } else if (chars.length > 9) {
    size = "smallest";
  }

  const rootClassName = classNames(styles.container, {
    [styles.large]: size === "large",
    [styles.medium]: size === "medium",
    [styles.small]: size === "small",
    [styles.smallest]: size === "smallest",
  });
  return (
    <div className={rootClassName}>
      <NumberFormat
        value={val}
        ref={inputRef}
        thousandSeparator={true}
        allowLeadingZeros={true}
        allowNegative={false}
        suffix={" " + symbol}
        onValueChange={handleChange}
        getInputRef={(input: any) => {
          inputRef.current = input;
        }}
        className={styles.input}
        placeholder={placeholder}
      />

      {
        <p className={styles.equivalent}>
          = {Numeral(usdValue).format("$0,0.00")}
        </p>
      }
    </div>
  );
};

export const BigCurrencyInputWrapper = styled("div")({
  marginTop: 40,
});
