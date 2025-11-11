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
    State,
} from "react-native-gesture-handler";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CoinService } from "../service/coin-service";
import { CoinSide, Coin } from "../data/entity/coin";
import { styles } from "../components/common/stylesheet";
import { BottomArea } from "../components/specific/coin-flipper/bottom-area";
import Toast from "react-native-toast-message";
import { useWallet } from "../context/wallet-context";
// TUTORIAL: imports
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
    FirstRunTutorial,
    TutorialProgress,
    TutorialStepKey,
} from "../components/tutorial/first-run-tutorial";
import { WalletService } from "../service/wallet-service";

const MIN_SCALE = 1;
const MAX_SCALE = 8;

const PROGRESS_KEY = "tutorial.progress";

// persist helper
async function loadProgress(): Promise<Partial<TutorialProgress>> {
    try {
        const raw = await AsyncStorage.getItem(PROGRESS_KEY);
        return raw ? JSON.parse(raw) : {};
    } catch {
        return {};
    }
}
async function saveProgress(update: Partial<TutorialProgress>) {
    try {
        const current = await loadProgress();
        const merged = { ...current, ...update };
        await AsyncStorage.setItem(PROGRESS_KEY, JSON.stringify(merged));
    } catch {}
}

// Small hook to check "tutorial.done" and avoid showing the overlay after completion
function useTutorialDone() {
    const [hydrated, setHydrated] = useState(false);
    const [done, setDone] = useState(false);
    useEffect(() => {
        let mounted = true;
        (async () => {
            try {
                const v = await AsyncStorage.getItem("tutorial.done");
                if (mounted) setDone(v === "1");
            } finally {
                if (mounted) setHydrated(true);
            }
        })();
        return () => {
            mounted = false;
        };
    }, []);
    return { hydrated, done };
}

export default function Flipper() {
    const router = useRouter();
    const routeParams = useLocalSearchParams<{
        coinId?: string;
        openInfo?: string; // "1" to open
        fromWallet?: string; // "info" (tapped coin) | "back" (swiped back)
    }>();

    const { addCoin, coins } = useWallet();

    // coin source: allow loading by id from wallet, or fallback to fresh random coin
    const [coin, setCoin] = useState<Coin>(() => new CoinService().generateNewCoin());

    useEffect(() => {
        if (routeParams?.coinId) {
            const fromWallet = WalletService.getCoins().find((c) => c.id === routeParams.coinId);
            if (fromWallet) {
                // map wallet coin shape -> Coin (keeps head/tails resources & descriptions)
                setCoin({
                    id: fromWallet.id,
                    title: fromWallet.title,
                    headImageResource: fromWallet.headImageResource,
                    tailsImageResource: fromWallet.tailsImageResource,
                    headDescription: fromWallet.headDescription,
                    tailsDescription: fromWallet.tailsDescription,
                    diameter: fromWallet.diameter,
                    weight: fromWallet.weight,
                    material: fromWallet.material,
                    date: fromWallet.date,
                } as Coin);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [routeParams?.coinId]);

    // initial side
    let initialSide = Math.random() < 0.5 ? CoinSide.HEADS : CoinSide.TAILS;
    const [coinSide, setCoinSide] = useState(initialSide);
    const [flipped, setFlipped] = useState(1);
    const [isFlipping, setIsFlipping] = useState(false);

    const flipAnimation = useRef(new Animated.Value(0)).current;

    // prediction dialog
    const [isDialogVisible, setIsDialogVisible] = useState(false);
    const [pendingPrediction, setPendingPrediction] = useState<CoinSide | null>(null);

    // last flip result (null until the first flip finishes)
    const [lastResult, setLastResult] = useState<CoinSide | null>(initialSide);
    const [resultSource, setResultSource] = useState<"flip" | "manual">("manual");

    // ZOOM / PAN / ROTATE state
    // ZOOM (pinch) state
    const renderScale = useRef(new Animated.Value(1)).current;
    const lastScaleRef = useRef(1);
    const [isZoomed, setIsZoomed] = useState(false);

    // PAN (drag) while zoomed
    const translate = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
    const panOffset = useRef({ x: 0, y: 0 });

    // ROTATION (two-finger)
    const renderRotation = useRef(new Animated.Value(0)).current;
    const lastRotationRef = useRef(0);

    // Gesture handler refs to control priority/simultaneity
    const pinchRef = useRef<any>(null);
    const panRef = useRef<any>(null);
    const rotateRef = useRef<any>(null);
    const doubleTapRef = useRef<any>(null);
    const singleTapRef = useRef<any>(null);

    // flip timers management
    const timersRef = useRef<number[]>([]);
    const clearFlipTimers = () => {
        timersRef.current.forEach((id) => clearTimeout(id));
        timersRef.current = [];
    };

    // TUTORIAL: progress & helpers
    const { hydrated: tutHydrated, done: tutorialDone } = useTutorialDone(); // ← gate overlay

    const [tutorial, setTutorial] = useState<TutorialProgress>({
        tapTwice: false,
        zoomedIn: false,
        rotated: false,
        zoomedOut: false,
        doubleTapped: false,
        openedInfo: false,
        swipeWallet: false,
        dragCoin: true,
        walletInfo: true,
        last: false,
    });
    const tapCounterRef = useRef(0);

    // hydrate from persistent progress (merge, do not overwrite)
    useEffect(() => {
        loadProgress().then((stored) => {
            setTutorial((prev) => ({ ...prev, ...stored }));
        });
    }, []);

    // If we came from the wallet screen as part of the tutorial, mark and persist
    useEffect(() => {
        if (routeParams?.fromWallet) {
            setTutorial((prev) => {
                const next = {
                    ...prev,
                    swipeWallet: true,
                    walletInfo: prev.walletInfo || routeParams.fromWallet === "info" || routeParams.fromWallet === "back",
                };
                // Only unlock "last" if all pre-wallet steps are already completed
                const preWalletDone =
                    next.tapTwice &&
                    next.zoomedIn &&
                    next.rotated &&
                    next.zoomedOut &&
                    next.doubleTapped &&
                    next.openedInfo &&
                    next.swipeWallet &&
                    next.walletInfo;
                if (preWalletDone) next.last = true;
                saveProgress(next);
                return next;
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [routeParams?.fromWallet]);

    const handleSkipStep = (step: TutorialStepKey) => {
        setTutorial((prev) => {
            const next = { ...prev, [step]: true };
            saveProgress({ [step]: true } as Partial<TutorialProgress>);
            return next;
        });
    };
    const handleSkipAll = async () => {
        const all: TutorialProgress = {
            tapTwice: true,
            zoomedIn: true,
            rotated: true,
            zoomedOut: true,
            doubleTapped: true,
            openedInfo: true,
            swipeWallet: true,
            dragCoin: true,
            walletInfo: true,
            last: true,
        };
        setTutorial(all);
        saveProgress(all);
        await AsyncStorage.setItem("tutorial.done", "1");
    };
    useEffect(() => {
        // touch AsyncStorage once (defensive; FirstRunTutorial persists itself)
        AsyncStorage.getItem("tutorial.done").then(() => {});
    }, []);

    // Pinch handlers
    // Pinch: live clamp to [1, MAX_SCALE]
    const onPinchEvent = ({ nativeEvent }: any) => {
        const nextUnclamped = lastScaleRef.current * nativeEvent.scale;
        const next = Math.max(MIN_SCALE, Math.min(nextUnclamped, MAX_SCALE));
        renderScale.setValue(next); // labels hidden while zoomed
        setIsZoomed(next > 1.001);

        // TUTORIAL: mark zoom completed when scale > 1×
        if (next > 1.001 && !tutorial.zoomedIn) {
            const upd = { zoomedIn: true };
            setTutorial((p) => ({ ...p, ...upd }));
            saveProgress(upd);
        }
    };
    const onPinchStateChange = ({ nativeEvent }: any) => {
        if (
            nativeEvent.state === State.END ||
            nativeEvent.state === State.CANCELLED ||
            nativeEvent.state === State.FAILED
        ) {
            // finalize the scale
            renderScale.stopAnimation((val: number) => {
                const clamped = Math.max(MIN_SCALE, Math.min(val ?? lastScaleRef.current, MAX_SCALE));
                renderScale.setValue(clamped);
                lastScaleRef.current = clamped;

                if (clamped === 1) {
                    translate.setValue({ x: 0, y: 0 });
                    panOffset.current = { x: 0, y: 0 };
                    renderRotation.setValue(0);
                    lastRotationRef.current = 0;
                    setIsZoomed(false);

                    // TUTORIAL: mark zoomed out after having zoomed in
                    if (!tutorial.zoomedOut && tutorial.zoomedIn) {
                        const upd = { zoomedOut: true };
                        setTutorial((p) => ({ ...p, ...upd }));
                        saveProgress(upd);
                    }
                }
            });
        }
    };

    // Pan handlers (when zoomed)
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

    // Rotation handlers (when zoomed)
    const onRotateEvent = ({ nativeEvent }: any) => {
        if (!isZoomed) return; // rotate only in zoom view
        const next = lastRotationRef.current + nativeEvent.rotation; // radians
        renderRotation.setValue(next);
    };
    const onRotateStateChange = ({ nativeEvent }: any) => {
        if (!isZoomed) return;
        if (
            nativeEvent.state === State.END ||
            nativeEvent.state === State.CANCELLED ||
            nativeEvent.state === State.FAILED
        ) {
            // accumulate rotation
            renderRotation.stopAnimation((val: number) => {
                lastRotationRef.current = val ?? lastRotationRef.current;
                // snap tiny angles to 0 for neatness when nearly straight
                if (Math.abs(lastRotationRef.current) < 0.01) {
                    lastRotationRef.current = 0;
                    renderRotation.setValue(0);
                }
                // TUTORIAL: mark rotated after a non-trivial angle
                if (Math.abs(lastRotationRef.current) >= 0.01 && !tutorial.rotated) {
                    const upd = { rotated: true };
                    setTutorial((p) => ({ ...p, ...upd }));
                    saveProgress(upd);
                }
            });
        }
    };

    // Tap handlers
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

            // TUTORIAL: two single taps required
            tapCounterRef.current += 1;
            if (tapCounterRef.current >= 2 && !tutorial.tapTwice) {
                const upd = { tapTwice: true };
                setTutorial((p) => ({ ...p, ...upd }));
                saveProgress(upd);
            }
        }
    };

    // Double tap: open prediction dialog only if zoom is at original size
    const onDoubleTap = ({ nativeEvent }: any) => {
        if (nativeEvent.state === State.ACTIVE) {
            if (Math.abs(lastScaleRef.current - 1) < 0.01) {
                setPendingPrediction(null);
                setIsDialogVisible(true);

                // TUTORIAL: mark double tap
                if (!tutorial.doubleTapped) {
                    const upd = { doubleTapped: true };
                    setTutorial((p) => ({ ...p, ...upd }));
                    saveProgress(upd);
                }
            }
        }
    };

    // --- Bottom sheet state ---
    const [isInfoVisible, setIsInfoVisible] = useState(false);
    const bottomSheetAnim = useRef(new Animated.Value(0)).current;
    const coinShiftAnim = useRef(new Animated.Value(0)).current; // 0 normal, 1 shifted up
    const dragY = useRef(new Animated.Value(0)).current;

    // Coin flip logic and animation
    const flipCoin = async () => {
        setIsFlipping(true);
        const MAX_ROTATIONS_LOCAL = 30;
        const MIN_ROTATIONS_LOCAL = 15;
        const rotations = Math.max(Math.floor(Math.random() * MAX_ROTATIONS_LOCAL) + 1, MIN_ROTATIONS_LOCAL);
        const duration = 1500;

        clearFlipTimers();
        // Hide previous result while a new flip is in progress
        setLastResult(null);

        Animated.timing(flipAnimation, {
            toValue: rotations,
            duration,
            easing: Easing.linear,
            useNativeDriver: true,
        }).start(() => {
            setFlipped(1);
            flipAnimation.setValue(0);
            // Done with all timers for this flip
            clearFlipTimers();
            setIsFlipping(false);

            // popup only if coin is added to the wallet
            let currentCoin = coinSide;
            const alreadyInWallet = coins.some((c) => c.id === coin.id);
            if (!alreadyInWallet) {
                addCoin(coin as any, currentCoin);
                Toast.show({
                    type: "success",
                    text1: "Münt on lisatud rahakotti",
                    text2: `Münt '${coin.title}' on lisatud teie rahakotti 🪙`,
                });
            }
        });

        const step = duration / (rotations + 1);
        let currentCoin = coinSide;
        let currentFlip = flipped;

        for (let t = step; duration - t > 0.001; t += step) {
            const id = setTimeout(() => {
                if (currentCoin === CoinSide.HEADS) {
                    setCoinSide(CoinSide.TAILS);
                    currentCoin = CoinSide.TAILS;
                } else {
                    setCoinSide(CoinSide.HEADS);
                    currentCoin = CoinSide.HEADS;
                }
                currentFlip = currentFlip === 1 ? -1 : 1;
                setFlipped(currentFlip);

                if (duration - t - step <= 0.001) {
                    setLastResult(currentCoin);
                    setResultSource("flip");
                }
            }, t) as unknown as number;
            timersRef.current.push(id);
        }
    };

    const handleChoosePrediction = (side: CoinSide) => {
        setPendingPrediction(side);
        setIsDialogVisible(false);
        requestAnimationFrame(() => flipCoin());
    };
    const handleFlipWithoutPrediction = () => {
        setIsDialogVisible(false);
        requestAnimationFrame(() => flipCoin());
    };

    const forceCoinUpright = () => {
        // kill any remaining tick timers
        clearFlipTimers();
        // stop the animated rotateX and reset pose
        try {
            flipAnimation.stopAnimation(() => {
                flipAnimation.setValue(0);
                setFlipped(1);
            });
        } catch {}
        setIsFlipping(false);
    };

    // --- Bottom sheet animations ---
    const openInfoSheet = () => {
        // normalize pose before animating the sheet
        forceCoinUpright();

        setIsInfoVisible(true);

        // TUTORIAL: mark info opened
        if (!tutorial.openedInfo) {
            const upd = { openedInfo: true };
            setTutorial((p) => ({ ...p, ...upd }));
            saveProgress(upd);
        }

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

    // Allow info swipe only when coin is at initial state
    const isCoinAtStart = () =>
        lastScaleRef.current <= 1.001 &&
        Math.abs(lastRotationRef.current) < 0.01 &&
        Math.abs(panOffset.current.x) < 0.5 &&
        Math.abs(panOffset.current.y) < 0.5;

    // --- Full-screen single-finger swipe detector (up to open sheet, left to wallet) ---
    const swipeResponder = useRef(
        PanResponder.create({
            // Don't claim the gesture at start
            onStartShouldSetPanResponder: () => false,

            // Claim only when: single finger, coin at start, significant vertical/horizontal move
            onMoveShouldSetPanResponder: (_, g) => {
                const singleTouch = (g.numberActiveTouches ?? 1) === 1;
                const bigMove = Math.abs(g.dx) > 20 || Math.abs(g.dy) > 20;
                // react only in neutral pose
                return singleTouch && bigMove && isCoinAtStart();
            },

            // Allow RNGH handlers to take over if they want (reduces deadlocks)
            onPanResponderTerminationRequest: () => true,
            onPanResponderRelease: (_, g) => {
                const absX = Math.abs(g.dx);
                const absY = Math.abs(g.dy);
                // vertical priority (info sheet)
                if (g.dy < -80 && absY > absX) {
                    forceCoinUpright();
                    openInfoSheet();
                    return;
                }
                // horizontal: right-to-left => go to wallet
                if (g.dx < -80 && absX > absY) {
                    // TUTORIAL: mark swipeWallet as completed and persist
                    setTutorial((prev) => {
                        const next = { ...prev, swipeWallet: true };
                        saveProgress({ swipeWallet: true });
                        return next;
                    });
                    // hand off to wallet tutorial
                    router.push({ pathname: "/wallet", params: { teach: "1" } });
                    return;
                }
            },
        })
    ).current;

    // If navigated with ?openInfo=1, open the sheet after coin is set
    useEffect(() => {
        if (routeParams?.openInfo === "1") {
            requestAnimationFrame(() => openInfoSheet());
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [routeParams?.openInfo, coin?.id]);

    // "Mine mängima" action from the last tutorial step
    const handleTutorialFinish = async () => {
        // If info is open, close it; otherwise just hide tutorial
        if (isInfoVisible) {
            closeInfoSheet();
        }
        const upd = { last: true };
        setTutorial((p) => ({ ...p, ...upd }));
        saveProgress(upd);
        await AsyncStorage.setItem("tutorial.done", "1"); // await to avoid race on navigation/redraw
    };

    // --- Render ---
    return (
        <View style={styles.container} {...swipeResponder.panHandlers}>
            <Text style={{ fontWeight: "500", fontSize: 24, color: "#e7e3e3ff" }}>
                {coin.title.charAt(0).toLocaleUpperCase() + coin.title.slice(1)}
            </Text>

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
                                <Animated.View
                                    pointerEvents="box-none"
                                    style={[styles.coinLayer, isInfoVisible && styles.coinLayerRaised]}
                                >
                                    <Animated.Image
                                        source={
                                            coinSide === CoinSide.HEADS
                                                ? coin.headImageResource
                                                : coin.tailsImageResource
                                        }
                                        style={[
                                            styles.coinImage,
                                            {
                                                transform: [
                                                    { translateX: translate.x },
                                                    { translateY: translate.y },
                                                    { scale: renderScale },
                                                    {
                                                        rotate: renderRotation.interpolate({
                                                            inputRange: [-Math.PI * 2, Math.PI * 2],
                                                            outputRange: ["-6.2832rad", "6.2832rad"],
                                                        }),
                                                    },
                                                    { scaleY: flipped },
                                                    {
                                                        rotateX: flipAnimation.interpolate({
                                                            inputRange: [0, 1],
                                                            outputRange: ["0deg", "180deg"],
                                                        }),
                                                    },
                                                    // coin shift
                                                    {
                                                        translateY: coinShiftAnim.interpolate({
                                                            inputRange: [0, 1],
                                                            outputRange: [0, -230], // coin shifts 230px
                                                        }),
                                                    },
                                                ],
                                            },
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
                {lastResult !== null && !isZoomed && (
                    <BottomArea side={lastResult} predicted={resultSource === "flip" ? pendingPrediction : null} />
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

                            <Pressable
                                style={styles.choiceCard}
                                onPress={() => handleChoosePrediction(CoinSide.TAILS)}
                                accessibilityRole="button"
                            >
                                <Text style={styles.choiceLabel}>Revers</Text>
                            </Pressable>
                        </View>

                        <View style={styles.separator} />

                        <TouchableOpacity onPress={handleFlipWithoutPrediction} style={styles.skipBtn}>
                            <Text style={styles.skipBtnText}>Viska ilma ennustuseta</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => setIsDialogVisible(false)} style={styles.closeBtn}>
                            <Text style={styles.closeBtnText}>Sulge</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Bottom sheet (animated) */}
            {isInfoVisible && (
                <Animated.View
                    style={[
                        styles.bottomSheet,
                        {
                            transform: [
                                {
                                    translateY: Animated.add(
                                        bottomSheetAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [400, 0],
                                        }),
                                        dragY
                                    ),
                                },
                            ],
                        },
                    ]}
                >
                    {/* Handle and Close Button */}
                    <View style={styles.sheetHeader}>
                        <View style={styles.sheetHandle} />
                        <TouchableOpacity onPress={closeInfoSheet} style={styles.sheetCloseBtn}>
                            <Text style={styles.sheetCloseIcon}>✕</Text>
                        </TouchableOpacity>
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

            {/* TUTORIAL OVERLAY */}
            {tutHydrated && !tutorialDone && (
                <FirstRunTutorial
                    progress={tutorial}
                    onSkipStep={(step) => {
                        const next = { ...tutorial, [step]: true };
                        setTutorial(next);
                        saveProgress({ [step]: true } as Partial<TutorialProgress>);
                    }}
                    onSkipAll={handleSkipAll}
                    onFinish={handleTutorialFinish}
                />
            )}
        </View>
    );
}
