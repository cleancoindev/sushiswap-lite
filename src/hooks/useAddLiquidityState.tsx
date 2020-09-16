import { useCallback, useContext, useState } from "react";

import { EthersContext } from "../context/EthersContext";
import { GlobalContext } from "../context/GlobalContext";
import { parseBalance } from "../utils";
import useLiquidityState, { LiquidityState } from "./useLiquidityState";
import useSDK from "./useSDK";

export interface AddLiquidityState extends LiquidityState {
    onAdd: () => Promise<void>;
    adding: boolean;
}

// tslint:disable-next-line:max-func-body-length
const useAddLiquidityState: () => AddLiquidityState = () => {
    const state = useLiquidityState();
    const { signer } = useContext(EthersContext);
    const { updateTokens } = useContext(GlobalContext);
    const [adding, setAdding] = useState(false);
    const { addLiquidity, addLiquidityETH } = useSDK();

    const onAdd = useCallback(async () => {
        if (state.fromToken && state.toToken && state.fromAmount && state.toAmount && signer) {
            setAdding(true);
            try {
                const fromAmount = parseBalance(state.fromAmount, state.fromToken.decimals);
                const toAmount = parseBalance(state.toAmount, state.toToken.decimals);
                if (state.fromSymbol === "ETH" || state.toSymbol === "ETH") {
                    const [token, amount, amountETH] =
                        state.fromSymbol === "ETH"
                            ? [state.toToken, toAmount, fromAmount]
                            : [state.fromToken, fromAmount, toAmount];
                    const tx = await addLiquidityETH(token, amount, amountETH);
                    await tx.wait();
                } else {
                    const tx = await addLiquidity(state.fromToken, state.toToken, fromAmount, toAmount);
                    await tx.wait();
                }
                await updateTokens();
                state.setFromSymbol("");
            } finally {
                setAdding(false);
            }
        }
    }, [state.fromToken, state.toToken, state.fromAmount, state.toAmount, signer, updateTokens]);

    return {
        ...state,
        onAdd,
        adding
    };
};

export default useAddLiquidityState;
