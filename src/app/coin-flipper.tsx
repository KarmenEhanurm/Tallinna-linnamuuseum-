import { useState, useRef } from "react";
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Animated,
    Modal,
    Image,
    Pressable,
    Dimensions,
    Easing
} from "react-native";
import { TapGestureHandler, State } from "react-native-gesture-handler"; // for double-tap
import { CoinService } from "../service/coin-service";
import { CoinSide } from "../data/entity/coin";
import { styles } from "../components/common/stylesheet";
import { BottomArea } from "../components/specific/coin-flipper/bottom-area";

export default function Flipper() {
    // Initially let's choose the coin's side randomly
    let initialSide = CoinSide.HEADS;
    if (Math.random() < 0.5)
        initialSide = CoinSide.TAILS;

    // State for representing which side of the coin we currently have
    const [ coinSide, setCoinSide ] = useState(initialSide)
    const [ flipped, setFlipped ] = useState(1)
    let currentFlip = flipped;

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
        const MAX_ROTATIONS = 30; // maximum amount of rotations the coin can do
        const MIN_ROTATIONS = 15;
        const rotations = Math.max(Math.floor(Math.random() * MAX_ROTATIONS) + 1, MIN_ROTATIONS);
        const duration = 1500; // milliseconds

        // Hide previous result while a new flip is in progress
        setLastResult(null);

        Animated.timing(flipAnimation, {
            toValue: rotations,
            duration: duration,
            easing: Easing.linear,
            useNativeDriver: true,
        }).start(() => {
            currentFlip = 1
            setFlipped(currentFlip)
            flipAnimation.setValue(0)
        });

        let step = duration / (rotations+1);
        let currentCoin = coinSide;
        for (let t = step; duration - t > 0.001; t += step) {
            setTimeout(() => {
                if (currentCoin === CoinSide.HEADS) {
                    setCoinSide(CoinSide.TAILS);
                    currentCoin = CoinSide.TAILS;
                } else {
                    setCoinSide(CoinSide.HEADS);
                    currentCoin = CoinSide.HEADS;
                }
                currentFlip = currentFlip === 1 ? -1 : 1
                setFlipped(currentFlip)

                if (duration - t - step <= 0.001)
                    setLastResult(currentCoin)
            }, t)
        }
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
            <Text style={{ fontWeight: 500, fontSize: 24 }}>{coin.title.charAt(0).toLocaleUpperCase() + coin.title.slice(1)}</Text>

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
                                    scaleX: flipped
                                },
                                {
                                    rotateY: flipAnimation.interpolate({
                                        inputRange: [0, 1],
                                        outputRange: ["0deg", "180deg"],
                                    }),
                                },
                            ],
                        }
                    ]}
                    resizeMode="contain"
                />
            </TapGestureHandler>

            {/* bottom area holds the result; coin remains centered because top & bottom flex are equal */}

            <View style={styles.bottomArea}>
                {(lastResult !== null) && (
                    <BottomArea side={lastResult} predicted={pendingPrediction}></BottomArea>
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


