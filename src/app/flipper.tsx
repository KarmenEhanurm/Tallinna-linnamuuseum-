import { useState, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Easing
} from "react-native";
import { CoinService } from "../service/coin-service";

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center"
    },
    coinImage: {
        width: 200,
        height: 200,
    },
});

/**
 * Enum for representing coin sides
 */
enum CoinSide {
    HEADS,
    TAILS
};

export default function Flipper() {
    // Initially let's choose the coin's side randomly
    let initialSide = CoinSide.HEADS;
    if (Math.random() < 0.5)
        initialSide = CoinSide.TAILS;

    // State for representing which side of the coin we currently have
    const [ coinSide, setCoinSide ] = useState(initialSide)

    // Animated value for the coin flip animation
    const flipAnimation = useRef(new Animated.Value(0)).current;

    // The actual coin that is going to be used
    const coin = new CoinService().generateNewCoin()

    // Coin flip logic and animation
    let flipCoin = async () => {
        // Animation parameters
        const MAX_ROTATIONS = 5; // maximum amount of rotations the coin can do
        const TIME_PER_ROTATION = 800; // milliseconds

        const rotations = Math.floor(Math.random() * MAX_ROTATIONS) + 1;
        const duration = rotations * TIME_PER_ROTATION;

        Animated.timing(flipAnimation, {
            toValue: rotations,
            duration: duration,
            easing: Easing.bezier(0.68, -0.55, 0.27, 1.55),
            useNativeDriver: true,
        }).start();

        // Change image halfway
        setTimeout(() => {
            if (Math.random() < 0.5)
                setCoinSide(CoinSide.HEADS);
            else setCoinSide(CoinSide.TAILS);
        }, duration / 2)

        // Reset animation after completion
        setTimeout(() => {
            flipAnimation.setValue(0);
        }, duration);
    }

    return (
        <View style={styles.container}>
            <TouchableOpacity onPress={flipCoin}>
                <Animated.Image
                    source={coinSide === CoinSide.HEADS ? coin.headImageResource : coin.tailsImageResource}
                    style={[
                        styles.coinImage,
                        {
                            // apply flip animation using rotateX
                            transform: [
                                {
                                    rotateX: flipAnimation.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ["0deg", "360deg"],
                                    }),
                                },
                                {
                                    rotateY: flipAnimation.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ["0deg", "360deg"]
                                    })
                                }
                            ]
                        }
                    ]}
                />
            </TouchableOpacity>
        </View>
    )
}