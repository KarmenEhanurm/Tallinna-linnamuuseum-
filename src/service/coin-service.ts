import { Coin } from "../data/entity/coin"

/**
 * Coin service provides
 */
export class CoinService {
    /**
     * Generates new coin for the coin flipper game
     * and returns its value
     */
    public generateNewCoin() : Coin {
        return {
            title: "tukat",
            date: "1990 - 2000",
            id: "1201021",
            headImageResource: require("../../assets/images/demo/museaal-1201021-head.webp"),
            tailsImageResource: require("../../assets/images/demo/museaal-1201021-tails.webp")
        }
    }
};