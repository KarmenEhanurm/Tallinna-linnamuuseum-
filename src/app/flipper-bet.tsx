import { useState, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Easing,
    Modal,
    Image,
    Pressable,
    Dimensions
} from "react-native";
import { TapGestureHandler, State } from "react-native-gesture-handler"; // for double-tap
import { CoinService } from "../service/coin-service";

/**
 * Enum for representing coin sides
 */
enum CoinSide {
    HEADS,
    TAILS
};

const { width } = Dimensions.get("window");

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

    // betting dialog state
    const [ isDialogVisible, setIsDialogVisible ] = useState(false);
    const [ pendingPrediction, setPendingPrediction ] = useState<CoinSide | null>(null);

    // Result of the last completed flip (null until the first flip finishes)
    const [ lastResult, setLastResult ] = useState<CoinSide | null>(null);

    // Coin flip logic and animation
    let flipCoin = async () => {
        // Animation parameters
        const MAX_ROTATIONS = 5; // maximum amount of rotations the coin can do
        const TIME_PER_ROTATION = 800; // milliseconds

        // Hide previous result while a new flip is in progress
        setLastResult(null);

        const rotations = Math.floor(Math.random() * MAX_ROTATIONS) + 1;
        const duration = rotations * TIME_PER_ROTATION;

        // Decide the result
        const result = Math.random() < 0.5 ? CoinSide.HEADS : CoinSide.TAILS;

        Animated.timing(flipAnimation, {
            toValue: rotations,
            duration: duration,
            easing: Easing.bezier(0.68, -0.55, 0.27, 1.55),
            useNativeDriver: true,
        }).start(() => {
            // Reset animation after completion
            flipAnimation.setValue(0);
            // At the end of the flip, show the result label
            setLastResult(result);
        });

        // Change image halfway
        setTimeout(() => {
            setCoinSide(result);
        }, duration / 2)

        // Reset animation after completion
        setTimeout(() => {
            flipAnimation.setValue(0);
        }, duration);
    }

    // double-tap handler: open the prediction dialog
    const onCoinDoubleTap = ({ nativeEvent }: any) => {
        if (nativeEvent.state === State.ACTIVE) {
            setPendingPrediction(null); // clear any previous prediction
            setIsDialogVisible(true);   // show dialog
        }
    };

    // choose Heads/Tails in the dialog, close dialog, then flip
    const handleChoosePrediction = (side: CoinSide) => {
        setPendingPrediction(side);
        setIsDialogVisible(false);
        // clear stored prediction
        requestAnimationFrame(() => {
            setPendingPrediction(null);
            flipCoin();
        });
    };

    // flip without choosing (Skip)
    const handleFlipWithoutPrediction = () => {
        setIsDialogVisible(false);
        requestAnimationFrame(() => {
            flipCoin();
        });
    };

    return (
        <View style={styles.container}>
            {/* top spacer keeps coin centered even when result appears */}
            <View style={{ flex: 1 }} />
            {/* Wrap the coin in a TapGestureHandler to detect double-tap for the betting dialog */}
            <TapGestureHandler numberOfTaps={2} onHandlerStateChange={onCoinDoubleTap}>
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
                    resizeMode="contain"
                />
            </TapGestureHandler>

            {/* bottom area holds the result; coin remains centered because top & bottom flex are equal */}

            <View style={styles.bottomArea}>
                {lastResult !== null && (
                    <Text style={styles.resultText}>
                        {lastResult === CoinSide.HEADS ? "Kull" : "Kiri"}
                    </Text>
                )}
            </View>

            {/* Prediction dialog */}
            <Modal
                visible={isDialogVisible}
                animationType="fade"
                transparent
                onRequestClose={() => setIsDialogVisible(false)}
            >
                <View style={styles.modalBackdrop}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalTitle}>Vali oma ennustus</Text>

                        <View style={styles.choicesRow}>
                            {/* Heads choice */}
                            <Pressable
                                style={styles.choiceCard}
                                onPress={() => handleChoosePrediction(CoinSide.HEADS)}
                                accessibilityRole="button"
                            >
                                <Image
                                    source={coin.headImageResource}
                                    style={styles.choiceImage}
                                    resizeMode="contain"
                                />
                                <Text style={styles.choiceLabel}>Kull</Text>
                            </Pressable>

                            {/* Tails choice */}
                            <Pressable
                                style={styles.choiceCard}
                                onPress={() => handleChoosePrediction(CoinSide.TAILS)}
                                accessibilityRole="button"
                            >
                                <Image
                                    source={coin.tailsImageResource}
                                    style={styles.choiceImage}
                                    resizeMode="contain"
                                />
                                <Text style={styles.choiceLabel}>Kiri</Text>
                            </Pressable>
                        </View>

                        <View style={styles.separator} />

                        {/* Skip: close modal and flip */}
                        <TouchableOpacity onPress={handleFlipWithoutPrediction} style={styles.skipBtn}>
                            <Text style={styles.skipBtnText}>Viska ilma ennustuseta</Text>
                        </TouchableOpacity>

                        {/* Close: close modal without flipping */}
                        <TouchableOpacity onPress={() => setIsDialogVisible(false)} style={styles.closeBtn}>
                            <Text style={styles.closeBtnText}>Sulge</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    )
}

const CARD_WIDTH = Math.min(168, Math.floor((width - 64) / 2));

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
    bottomArea: {
        flex: 1,
        alignItems: "center",
        paddingTop: 12,
    },
    resultText: {
        fontWeight: "700"
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: "#1918188c",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
    },
    modalCard: {
        width: "100%",
        maxWidth: 540,
        backgroundColor: "#1c1d1fff",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#ffffff0f",
    },
    modalTitle: {
        color: "#ffffff",
        fontSize: 18,
        fontWeight: "700",
        textAlign: "center",
        marginBottom: 12,
    },
    choicesRow: {
        width: "100%",
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    choiceCard: {
        width: CARD_WIDTH,
        alignItems: "center",
        backgroundColor: "#131418ff",
        borderRadius: 14,
        padding: 12,
        borderWidth: 1,
        borderColor: "#ffffff14",
        marginHorizontal: 6,
    },
    choiceImage: { 
        width: CARD_WIDTH - 24, 
        height: CARD_WIDTH - 24, 
        marginBottom: 10 
    },
    choiceLabel: { 
        color: "#ffffffff", 
        fontWeight: "600" },
    separator: { 
        height: 1, 
        backgroundColor: "#ffffff14", 
        marginVertical: 10 },
    skipBtn: {
        alignSelf: "center",
        backgroundColor: "#2f6feb",
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 999,
    },
    skipBtnText: { 
        color: "#ffffffff", 
        fontWeight: "700" },
    closeBtn: { 
        alignSelf: "center", 
        marginTop: 10, 
        padding: 8 },
    closeBtnText: { 
        color: "#b0b5baff", 
        fontWeight: "600" },
});