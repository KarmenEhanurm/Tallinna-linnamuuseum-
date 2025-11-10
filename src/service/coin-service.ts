import { getDataConnect } from "firebase/data-connect"
import { Coin } from "../data/entity/coin"
import { connectorConfig, coinCount, coinById } from '@dataconnect/generated'
import { app  } from "../config"
import { getStorage, ref, getDownloadURL } from "firebase/storage"
import { Image } from "react-native"

const dataConnect = getDataConnect(app, connectorConfig)
const storage = getStorage(app)

/**
 * Coin service provides
 */
export class CoinService {
    coinCount?: number

    /**
     * Generates new coin for the coin flipper game
     * and returns its value
     */
    public async generateNewCoin() : Promise<Coin> {
        if (this.coinCount === undefined)
            this.coinCount = (await coinCount()).data.coinMeta?.id_count

        const idx = Math.floor(Math.random() * (this.coinCount === undefined ? 1 : this.coinCount) + 1)

        const coin = (await coinById({id: `${idx}`})).data.coinMetas[0]

        const headsURL = await getDownloadURL(ref(storage, `images/museaal-${coin.muisId}-tails.webp`))
        const tailsURL = await getDownloadURL(ref(storage, `images/museaal-${coin.muisId}-head.webp`))

        // Pre-fetch images
        await Image.prefetch(headsURL)
        await Image.prefetch(tailsURL)

        return {
            id: coin.muisId,
            title: coin.title,
            date: coin.date,
            diameterMm: coin.diameterMm,
            description: coin.description,
            headImageResource: headsURL,
            tailsImageResource: tailsURL
        }
    }
};

export const coinService = new CoinService()