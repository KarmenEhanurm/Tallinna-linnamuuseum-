import { useState, useRef, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    Animated,
    Modal,
    Image,
    Pressable,
    Easing,
    PanResponder,
} from "react-native";

import {
    TapGestureHandler,
    PinchGestureHandler,
    PanGestureHandler,
    RotationGestureHandler,
    State
} from "react-native-gesture-handler"; // taps + pinch + pan + rotate
import { CoinService } from "../service/coin-service";
import { CoinSide } from "../data/entity/coin";
import { styles } from "../components/common/stylesheet";
import { BottomArea } from "../components/specific/coin-flipper/bottom-area";

import Toast from "react-native-toast-message";

export default function Flipper() {
    // --- Initial state ---
    let initialSide = Math.random() < 0.5 ? CoinSide.HEADS : CoinSide.TAILS;
    const [coinSide, setCoinSide] = useState(initialSide);
    const [flipped, setFlipped] = useState(1);

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
    const coin = new CoinService().generateNewCoin();

    const [isDialogVisible, setIsDialogVisible] = useState(false);
    const [pendingPrediction, setPendingPrediction] = useState<CoinSide | null>(null);
    const [lastResult, setLastResult] = useState<CoinSide | null>(null);

    // --- Bottom sheet state ---
    const [isInfoVisible, setIsInfoVisible] = useState(false);
    const bottomSheetAnim = useRef(new Animated.Value(0)).current;
    const coinShiftAnim = useRef(new Animated.Value(0)).current; // 0 = normal, 1 = shifted up, for info sheet
    const dragY = useRef(new Animated.Value(0)).current;

    // --- Flip coin logic ---
    const flipCoin = async () => {
        const MAX_ROTATIONS = 30;
        const MIN_ROTATIONS = 15;
        const rotations = Math.max(Math.floor(Math.random() * MAX_ROTATIONS) + 1, MIN_ROTATIONS);
        const duration = 1500;

    // Result of the last completed flip (null until the first flip finishes)
    const [ lastResult, setLastResult ] = useState<CoinSide | null>(initialSide);
    // Track if label came from a flip or manual tap (controls verdict visibility)
    const [ resultSource, setResultSource ] = useState<"flip" | "manual">("manual");

    // ZOOM (pinch) state
    const renderScale = useRef(new Animated.Value(1)).current; // what we actually apply to transform
    const lastScaleRef = useRef(1); // numeric accumulator (base)
    const [isZoomed, setIsZoomed] = useState(false); // UI flag to hide text when zoomed

    // PAN (drag) while zoomed
    const translate = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
    const panOffset = useRef({ x: 0, y: 0 }); // accumulator to prevent jumps

    // ROTATION (two-finger)
    const renderRotation = useRef(new Animated.Value(0)).current; // what we apply to transform (radians)
    const lastRotationRef = useRef(0); // numeric accumulator (radians)

    // Gesture handler refs to control priority/simultaneity
    const pinchRef = useRef<any>(null);
    const panRef = useRef<any>(null);
    const rotateRef = useRef<any>(null);
    const doubleTapRef = useRef<any>(null);
    const singleTapRef = useRef<any>(null);

    // Keep track of scheduled timeouts during flip to cancel later (prevents flicker/late toggles)
    const timersRef = useRef<number[]>([]);
    const clearFlipTimers = () => {
        timersRef.current.forEach(id => clearTimeout(id));
        timersRef.current = [];
    };

    // Pinch: live clamp to [1, MAX_SCALE]
    const onPinchEvent = ({ nativeEvent }: any) => {
        // live scaling without undershoot/snap-back
        const nextUnclamped = lastScaleRef.current * nativeEvent.scale;
        const next = Math.max(MIN_SCALE, Math.min(nextUnclamped, MAX_SCALE));
        renderScale.setValue(next);
        // mark zoomed flag immediately for UI (labels hidden while zoomed)
        setIsZoomed(next > 1.001);
    };

    const onPinchStateChange = ({ nativeEvent }: any) => {
        if (nativeEvent.state === State.END || nativeEvent.state === State.CANCELLED || nativeEvent.state === State.FAILED) {
            // finalize the scale
            renderScale.stopAnimation((val: number) => {
                const clamped = Math.max(MIN_SCALE, Math.min(val ?? lastScaleRef.current, MAX_SCALE));
                renderScale.setValue(clamped);
                lastScaleRef.current = clamped;

                if (clamped === 1) {
                    // reset pan & rotation when back to original size
                    translate.setValue({ x: 0, y: 0 });
                    panOffset.current = { x: 0, y: 0 };
                    renderRotation.setValue(0);
                    lastRotationRef.current = 0;
                    setIsZoomed(false);
                }
            });
        }
    };

    // Pan (drag): active only when zoomed
    const onPanGestureEvent = ({ nativeEvent }: any) => {
        if (!isZoomed) return;
        const x = panOffset.current.x + nativeEvent.translationX;
        const y = panOffset.current.y + nativeEvent.translationY;
        translate.setValue({ x, y });
    };

    const onPanStateChange = ({ nativeEvent }: any) => {
        if (nativeEvent.state === State.END || nativeEvent.state === State.CANCELLED || nativeEvent.state === State.FAILED) {
            if (lastScaleRef.current <= 1.001) {
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

    // Rotate (two-finger twist): active only when zoomed
    const onRotateEvent = ({ nativeEvent }: any) => {
        if (!isZoomed) return; // rotate only in zoom view
        const next = lastRotationRef.current + nativeEvent.rotation; // radians
        renderRotation.setValue(next);
    };

    const onRotateStateChange = ({ nativeEvent }: any) => {
        if (!isZoomed) return;
        if (nativeEvent.state === State.END || nativeEvent.state === State.CANCELLED || nativeEvent.state === State.FAILED) {
            // accumulate rotation
            renderRotation.stopAnimation((val: number) => {
                lastRotationRef.current = val ?? lastRotationRef.current;
                // snap tiny angles to 0 for neatness when nearly straight
                if (Math.abs(lastRotationRef.current) < 0.01) {
                    lastRotationRef.current = 0;
                    renderRotation.setValue(0);
                }
            });
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
        const MAX_ROTATIONS_LOCAL = 30; // maximum amount of rotations the coin can do
        const MIN_ROTATIONS_LOCAL = 15;
        const rotations = Math.max(Math.floor(Math.random() * MAX_ROTATIONS_LOCAL) + 1, MIN_ROTATIONS_LOCAL);
        const duration = 1500; // milliseconds

        // Before starting a new flip, cancel any old timers to avoid stray toggles
        clearFlipTimers();

        // Hide previous result while a new flip is in progress
        setLastResult(null);

        Animated.timing(flipAnimation, {
        toValue: rotations,
        duration,
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

        let step = duration / (rotations + 1);
        let currentCoin = coinSide;
        let currentFlip = flipped;

        for (let t = step; duration - t > 0.001; t += step) {

        setTimeout(() => {
            currentCoin = currentCoin === CoinSide.HEADS ? CoinSide.TAILS : CoinSide.HEADS;
            currentFlip = currentFlip === 1 ? -1 : 1;
            setCoinSide(currentCoin);
            setFlipped(currentFlip);

            if (duration - t - step <= 0.001) setLastResult(currentCoin);
        }, t);
        }
    };

    // --- Dialog interaction ---
    const onCoinDoubleTap = ({ nativeEvent }: any) => {
        if (nativeEvent.state === State.ACTIVE) {
        setPendingPrediction(null);
        setIsDialogVisible(true);
        }
    };


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
        requestAnimationFrame(() => flipCoin());
    };

    const handleFlipWithoutPrediction = () => {
        setIsDialogVisible(false);
        requestAnimationFrame(() => flipCoin());
    };

    // --- Bottom sheet animations ---
    const openInfoSheet = () => {
    setIsInfoVisible(true);

    Animated.parallel([
        Animated.timing(bottomSheetAnim, {
        toValue: 1,
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
        }),
        Animated.timing(coinShiftAnim, {
        toValue: 1, // move coin up
        duration: 300,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
        }),
    ]).start();
    };

    const closeInfoSheet = () => {
    Animated.parallel([
        Animated.timing(bottomSheetAnim, {
        toValue: 0,
        duration: 300,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
        }),
        Animated.timing(coinShiftAnim, {
        toValue: 0, // move coin back down
        duration: 300,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
        }),
    ]).start(() => setIsInfoVisible(false));
    };


    // --- Swipe-up gesture anywhere on screen ---
    const panResponder = useRef(
        PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) =>
            Math.abs(gestureState.dy) > 20,
        onPanResponderRelease: (_, gestureState) => {
            if (gestureState.dy < -80) openInfoSheet();
        },
        })
    ).current;

    // --- Drag-down gesture on the sheet ---
    const sheetPanResponder = useRef(
        PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderMove: (_, gesture) => {
            if (gesture.dy > 0) dragY.setValue(gesture.dy);
        },
        onPanResponderRelease: (_, gesture) => {
            if (gesture.dy > 100) {
            closeInfoSheet();
            } else {
            Animated.spring(dragY, { toValue: 0, useNativeDriver: true }).start();
            }
        },
        })
    ).current;

    // --- Render ---
    return (
        <View style={styles.container} {...panResponder.panHandlers}>
        <Text style={{ fontWeight: "500", fontSize: 24 }}>
            {coin.title.charAt(0).toLocaleUpperCase() + coin.title.slice(1)}
        </Text>


        <View style={{ flex: 1 }} />

        {/* Coin with double-tap prediction */}
        <TapGestureHandler numberOfTaps={2} onHandlerStateChange={onCoinDoubleTap}>
            <Animated.Image
            source={coinSide === CoinSide.HEADS ? coin.headImageResource : coin.tailsImageResource}
            style={[
                styles.coinImage,
                {
                transform: [
                    { scaleY: flipped },
                    {
                        rotateX: flipAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: ["0deg", "180deg"],
                        }),
                    },
                    {
                        translateY: coinShiftAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, -230], // moves coin up 230px when sheet opens
                        }),
                    },
                    ],
                },
            ]}
            resizeMode="contain"
            />
        </TapGestureHandler>

        <View style={styles.bottomArea}>
            {lastResult !== null && (
            <BottomArea side={lastResult} predicted={pendingPrediction} />
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

                <TouchableOpacity
                onPress={handleFlipWithoutPrediction}
                style={styles.skipBtn}
                >
                <Text style={styles.skipBtnText}>Viska ilma ennustuseta</Text>
                </TouchableOpacity>

                <TouchableOpacity
                onPress={() => setIsDialogVisible(false)}
                style={styles.closeBtn}
                >
                <Text style={styles.closeBtnText}>Sulge</Text>
                </TouchableOpacity>
            </View>
            </View>
        </Modal>

        {/* --- Bottom Sheet --- */}
        {isInfoVisible && (
        <Animated.View
            style={[
            styles.bottomSheet,
            {
            transform: [
            {
            translateY: bottomSheetAnim.interpolate({
                inputRange: [0, 1],
              outputRange: [400, 0], // slides up from bottom
            }),
            },
        ],

            },
            ]}
            {...sheetPanResponder.panHandlers}
        >
            {/* Handle and Close Button */}
            <View style={styles.sheetHeader}>
            <View style={styles.sheetHandle} />
            <TouchableOpacity onPress={closeInfoSheet} style={styles.sheetCloseBtn}>
                <Text style={styles.sheetCloseIcon}>✕</Text>
            </TouchableOpacity>

            {/* top spacer keeps coin centered even when result appears */}
            <View style={{ flex: 1 }} />

            {/* Double-tap wraps single-tap; taps wait for gesture handlers (pinch/pan/rotate) */}
            <TapGestureHandler
                ref={doubleTapRef}
                numberOfTaps={2}
                waitFor={[pinchRef, panRef, rotateRef]}
                onHandlerStateChange={onDoubleTap}
            >
                <TapGestureHandler
                    ref={singleTapRef}
                    waitFor={[doubleTapRef, pinchRef, panRef, rotateRef]}
                    onHandlerStateChange={onSingleTap}
                >
                    {/* Pinch, rotate and pan recognize simultaneously (rotate/pan only when zoomed) */}
                    <PinchGestureHandler
                        ref={pinchRef}
                        simultaneousHandlers={[panRef, rotateRef]}
                        onGestureEvent={onPinchEvent}
                        onHandlerStateChange={onPinchStateChange}
                    >
                        <RotationGestureHandler
                            ref={rotateRef}
                            enabled={isZoomed}
                            simultaneousHandlers={[pinchRef, panRef]}
                            onGestureEvent={onRotateEvent}
                            onHandlerStateChange={onRotateStateChange}
                        >
                            <PanGestureHandler
                                ref={panRef}
                                enabled={isZoomed}
                                simultaneousHandlers={[pinchRef, rotateRef]}
                                onGestureEvent={onPanGestureEvent}
                                onHandlerStateChange={onPanStateChange}
                            >
                                <Animated.View>
                                    <Animated.Image
                                        source={coinSide === CoinSide.HEADS ? coin.headImageResource : coin.tailsImageResource}
                                        style={[
                                            styles.coinImage,
                                            {
                                                // pan + zoom + rotate + flip transforms
                                                transform: [
                                                    { translateX: translate.x },
                                                    { translateY: translate.y },
                                                    { scale: renderScale }, // pinch-to-zoom (clamped live)
                                                    {
                                                        rotate: renderRotation.interpolate({
                                                            inputRange: [-Math.PI * 2, Math.PI * 2],
                                                            outputRange: ['-6.2832rad', '6.2832rad'],
                                                            extrapolate: 'extend',
                                                        })
                                                    },
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
                        </RotationGestureHandler>
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

            {/* Scrollable info content */}
            <View style={{ width: "100%", paddingHorizontal: 20 }}>
            <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>Aasta</Text>
                <Text style={styles.infoValue}>{coin.date ?? "—"}</Text>
            </View>


            <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>Mõõdud</Text>
                <Text style={styles.infoValue}>
                Läbimõõt: {coin.diameter ?? "—"} mm{"\n"}Kaal: {coin.weight ?? "—"} g 
                </Text>
            </View>

            <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>Materjal</Text>
                <Text style={styles.infoValue}>{coin.material ?? "—"}</Text>
            </View>

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


            <View style={styles.infoCard}>
                <Text style={styles.infoTitle}>Kirjeldus</Text>
                <Text style={styles.infoValue}>
                <Text style={{ fontWeight: "bold" }}>Kull pool: </Text>
                {coin.headDescription ?? "—"}
                {"\n"}
                <Text style={{ fontWeight: "bold" }}>Kiri pool: </Text>
                {coin.tailsDescription ?? "—"}
                </Text>
            </View>
            </View>
        </Animated.View>
        )}

        </View>
    );
    }
