import { CoinSide } from "@/src/data/entity/coin"
import { Text } from "@react-navigation/elements"
import { View } from "react-native"
import { styles } from "../../common/stylesheet"

export function BottomArea({ side, predicted }: { side: CoinSide, predicted: CoinSide | null }) {
    const color = predicted === side ? "green" : "red"
    return (
        <View style={{flex: 1, alignItems: "center"}}>
            <Text style={styles.resultText}>
                {side === CoinSide.HEADS ? "Kull" : "Kiri"}
            </Text>
            {predicted !== null && (
                <Text style={{color: color}}>
                    {predicted === side ? "Ennustus läks täppi!" : "Ennustus ei läinud täppi"}
                </Text>
            )}
        </View>
    )
}