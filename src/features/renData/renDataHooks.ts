import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { setFees } from "./renDataSlice";
import { fetchFees } from "./renDataUtils";

export const useFees = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    fetchFees().then((fees) => {
      dispatch(setFees(fees));
    });
  }, [dispatch]);
};
