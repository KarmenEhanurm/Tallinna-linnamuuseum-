import { useState, useRef } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Animated,
    Modal,
    Image,
    Pressable,
    Easing
} from "react-native";
import {
    TapGestureHandler,
    PinchGestureHandler,
    PanGestureHandler,
    State
} from "react-native-gesture-handler"; // taps + pinch + pan
import { CoinService } from "../service/coin-service";
import { CoinSide } from "../data/entity/coin";
import { styles } from "../components/common/stylesheet";
import { BottomArea } from "../components/specific/coin-flipper/bottom-area";
import Toast from 'react-native-toast-message';
import { useWallet } from "../context/wallet-context";

const MIN_SCALE = 1;
const MAX_SCALE = 8;

export default function Flipper() {

    const { addCoin, coins } = useWallet();
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
    const [ lastResult, setLastResult ] = useState<CoinSide | null>(initialSide);
    // Track if label came from a flip or manual tap (controls verdict visibility)
    const [ resultSource, setResultSource ] = useState<"flip" | "manual">("manual");

    // ZOOM (pinch) state
    const baseScale = useRef(new Animated.Value(1)).current; // accumulated scale
    const pinchScale = useRef(new Animated.Value(1)).current; // current pinch delta
    const scale = Animated.multiply(baseScale, pinchScale); // effective scale
    const lastScaleRef = useRef(1); // numeric tracker for logic
    const [isZoomed, setIsZoomed] = useState(false); // UI flag to hide text when zoomed

    // PAN (drag) while zoomed
    const translate = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
    const panOffset = useRef({ x: 0, y: 0 }); // accumulator to prevent jumps

    // Gesture handler refs to control priority/simultaneity
    const pinchRef = useRef<any>(null);
    const panRef = useRef<any>(null);
    const doubleTapRef = useRef<any>(null);
    const singleTapRef = useRef<any>(null);

    // Keep track of scheduled timeouts during flip to cancel later (prevents flicker/late toggles)
    const timersRef = useRef<number[]>([]);
    const clearFlipTimers = () => {
        timersRef.current.forEach(id => clearTimeout(id));
        timersRef.current = [];
    };

    const onPinchEvent = Animated.event(
        [{ nativeEvent: { scale: pinchScale } }],
        { useNativeDriver: false }
    );

    const onPinchStateChange = ({ nativeEvent }: any) => {
        if (nativeEvent.state === State.BEGAN) {
            setIsZoomed(true);
        }
        if (
            nativeEvent.state === State.END ||
            nativeEvent.state === State.CANCELLED ||
            nativeEvent.state === State.FAILED
        ) {
            const next = Math.max(
                MIN_SCALE,
                Math.min(lastScaleRef.current * nativeEvent.scale, MAX_SCALE)
            );
            baseScale.setValue(next);
            pinchScale.setValue(1);
            lastScaleRef.current = next;

            if (next === 1) {
                // back to original size → reset pan & zoom flag
                translate.setValue({ x: 0, y: 0 });
                panOffset.current = { x: 0, y: 0 };
                setIsZoomed(false);
            } else {
                setIsZoomed(true);
            }
        }
    };

    // Pan handler (manual to avoid jumps; uses an offset accumulator)
    const onPanGestureEvent = ({ nativeEvent }: any) => {
        if (!isZoomed) return;
        const x = panOffset.current.x + nativeEvent.translationX;
        const y = panOffset.current.y + nativeEvent.translationY;
        translate.setValue({ x, y });
    };

    const onPanStateChange = ({ nativeEvent }: any) => {
        if (
            nativeEvent.state === State.END ||
            nativeEvent.state === State.CANCELLED ||
            nativeEvent.state === State.FAILED
        ) {
            if (lastScaleRef.current <= 1.01) {
                translate.setValue({ x: 0, y: 0 });
                panOffset.current = { x: 0, y: 0 };
            } else {
                panOffset.current = {
                    x: panOffset.current.x + nativeEvent.translationX,
                    y: panOffset.current.y + nativeEvent.translationY,
                };
            }
        }
    };

    // Single tap: toggle side; sync label, drop verdict; CANCEL any leftover flip timers
    const onSingleTap = ({ nativeEvent }: any) => {
        if (nativeEvent.state === State.END) {
            clearFlipTimers(); // prevent late timeouts from previous flip
            setFlipped(1); // ensure upright (prevents upside-down artifact)
            flipAnimation.stopAnimation();
            flipAnimation.setValue(0);

            const nextSide = coinSide === CoinSide.HEADS ? CoinSide.TAILS : CoinSide.HEADS;
            setCoinSide(nextSide);
            setLastResult(nextSide);
            setResultSource("manual"); // hide prediction verdict in BottomArea
        }
    };

    // Double tap: open prediction dialog only if zoom is at original size
    const onDoubleTap = ({ nativeEvent }: any) => {
        if (nativeEvent.state === State.ACTIVE) {
            if (Math.abs(lastScaleRef.current - 1) < 0.01) {
                setPendingPrediction(null);
                setIsDialogVisible(true);
            }
        }
    };

    // Coin flip logic and animation
    let flipCoin = async () => {
        // Animation parameters
        const MAX_ROTATIONS = 30; // maximum amount of rotations the coin can do
        const MIN_ROTATIONS = 15;
        const rotations = Math.max(Math.floor(Math.random() * MAX_ROTATIONS) + 1, MIN_ROTATIONS);
        const duration = 1500; // milliseconds

        // Before starting a new flip, cancel any old timers to avoid stray toggles
        clearFlipTimers();

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

            // Done with all timers for this flip
            clearFlipTimers();

            //popup only if coin is added to the wallet
            let currentCoin = coinSide;
            const alreadyInWallet = coins.some(c => c.id === coin.id);
            if (!alreadyInWallet) {
                addCoin(coin, currentCoin);

                // Show notification that the coin has been added to the wallet
                Toast.show({
                    type: "success",
                    text1: "Münt on lisatud rahakotti",
                    text2: `Münt '${coin.title}' on lisatud teie rahakotti 🪙`
                });
            }
        });

        let step = duration / (rotations+1);
        let currentCoin = coinSide;
        for (let t = step; duration - t > 0.001; t += step) {
            const id = setTimeout(() => {
                if (currentCoin === CoinSide.HEADS) {
                    setCoinSide(CoinSide.TAILS);
                    currentCoin = CoinSide.TAILS;
                } else {
                    setCoinSide(CoinSide.HEADS);
                    currentCoin = CoinSide.HEADS;
                }
                currentFlip = currentFlip === 1 ? -1 : 1
                setFlipped(currentFlip)

                if (duration - t - step <= 0.001) {
                    setLastResult(currentCoin);
                    setResultSource("flip");
                }
            }, t) as unknown as number;
            timersRef.current.push(id);
        }
    }

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

            {/* Double-tap wraps single-tap; single waits for double so it doesn't trigger on double.
                Also: single/double taps wait for pinch & pan*/}
            <TapGestureHandler
                ref={doubleTapRef}
                numberOfTaps={2}
                waitFor={[pinchRef, panRef]}
                onHandlerStateChange={onDoubleTap}
            >
                <TapGestureHandler
                    ref={singleTapRef}
                    waitFor={[doubleTapRef, pinchRef, panRef]}
                    onHandlerStateChange={onSingleTap}
                >
                    {/* Pinch & pan recognize simultaneously; pinch has priority via taps waiting */}
                    <PinchGestureHandler
                        ref={pinchRef}
                        simultaneousHandlers={panRef}
                        onGestureEvent={onPinchEvent}
                        onHandlerStateChange={onPinchStateChange}
                    >
                        <PanGestureHandler
                            ref={panRef}
                            simultaneousHandlers={pinchRef}
                            enabled={isZoomed}
                            onGestureEvent={onPanGestureEvent}
                            onHandlerStateChange={onPanStateChange}
                        >
                            <Animated.View>
                                <Animated.Image
                                    source={coinSide === CoinSide.HEADS ? coin.headImageResource : coin.tailsImageResource}
                                    style={[
                                        styles.coinImage,
                                        {
                                            // pan + zoom + flip transforms
                                            transform: [
                                                { translateX: translate.x },
                                                { translateY: translate.y },
                                                { scale }, // pinch-to-zoom
                                                { scaleY: flipped },
                                                {
                                                    rotateX: flipAnimation.interpolate({
                                                        inputRange: [0, 1],
                                                        outputRange: ["0deg", "180deg"],
                                                    }),
                                                },
                                            ],
                                        }
                                    ]}
                                    resizeMode="contain"
                                />
                            </Animated.View>
                        </PanGestureHandler>
                    </PinchGestureHandler>
                </TapGestureHandler>
            </TapGestureHandler>

            {/* bottom area holds the result; hidden while zoomed */}
            <View style={styles.bottomArea}>
                {(lastResult !== null && !isZoomed) && (
                    <BottomArea
                        side={lastResult}
                        predicted={resultSource === "flip" ? pendingPrediction : null}
                    />
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
                                <Text style={styles.choiceLabel}>Avers</Text>
                            </Pressable>

                            {/* Tails choice */}
                            <Pressable
                                style={styles.choiceCard}
                                onPress={() => handleChoosePrediction(CoinSide.TAILS)}
                                accessibilityRole="button"
                            >
                                <Text style={styles.choiceLabel}>Revers</Text>
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


