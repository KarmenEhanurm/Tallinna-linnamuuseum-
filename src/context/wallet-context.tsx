import React, { createContext, useContext, useState, ReactNode } from "react";
import { WalletCoin, WalletService } from "../service/wallet-service";
import { Coin, CoinSide } from "../data/entity/coin";

interface WalletContextType {
    coins: WalletCoin[];
    addCoin: (coin: Coin, side: CoinSide) => void;
    updateCoinPosition: (coinId: string, x: number, y: number) => void;
    clearWallet: () => void;
}

// Create React context to provide wallet state and actions to all screens
const WalletContext = createContext<WalletContextType | undefined>(undefined);

export function WalletProvider({ children }: { children: ReactNode }) {
    // Local state holds current coins in the wallet
    const [coins, setCoins] = useState<WalletCoin[]>([]);
    // Add a coin to the wallet only if the coin is not yet added
    const addCoin = (coin: Coin, side: CoinSide) => {
    const alreadyInWallet = WalletService.getCoins().some(c => c.id === coin.id);
    if (!alreadyInWallet) {
    // Calls service to add coin and updates context state
        WalletService.addCoin(coin, side);
        setCoins(WalletService.getCoins());
    }
};
    // Update a coin's position in the wallet when it is dragged
    const updateCoinPosition = (coinId: string, x: number, y: number) => {
        WalletService.updateCoinPosition(coinId, x, y);
        setCoins(WalletService.getCoins());
    };
    // Clear the wallet (remove all coins)(not in use right now)
    const clearWallet = () => {
        WalletService.clearWallet();
        setCoins([]);
    };
    // Provide wallet state and actions to all children
    return (
        <WalletContext.Provider value={{ coins, addCoin, updateCoinPosition, clearWallet }}>
            {children}
        </WalletContext.Provider>
    );
}
// Custom hook to access wallet context safely 
export function useWallet() {
    const context = useContext(WalletContext);
    if (!context) {
        throw new Error("useWallet must be used within WalletProvider");
    }
    return context;
}
