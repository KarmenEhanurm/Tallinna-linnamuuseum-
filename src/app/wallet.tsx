import React, { useEffect, useRef, useState } from "react";
import { View, Text, Image, Animated, PanResponder, Dimensions } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useWallet } from "../context/wallet-context";
import { styles } from "../components/common/stylesheet";
import { CoinSide } from "../data/entity/coin";
// TUTORIAL: imports
import { FirstRunTutorial, TutorialProgress, TutorialStepKey } from "../components/tutorial/first-run-tutorial";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Get screen dimensions for centering coin
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const EDGE_BACK_WIDTH = 24; // px from the left edge for the back-swipe

const PROGRESS_KEY = "tutorial.progress";

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

export default function Wallet() {
    const router = useRouter();
    const params = useLocalSearchParams<{ teach?: string }>();
    const { coins, updateCoinPosition } = useWallet();
    const { hydrated: tutHydrated, done: tutorialDone } = useTutorialDone(); // gate overlay

    // --- Tutorial state for Wallet screen only ---
    const [tutorial, setTutorial] = useState<TutorialProgress>(() => ({
        // Flip-page steps are treated as completed here so wallet-specific steps can show
        tapTwice: true,
        zoomedIn: true,
        rotated: true,
        zoomedOut: true,
        doubleTapped: true,
        openedInfo: true,
        // Wallet steps start here:
        swipeWallet: params?.teach === "1",
        dragCoin: false,
        walletInfo: false,
        last: false,
    }));

    // allow forcing "last" to show on Wallet (when user skips walletInfo)
    const [forceLastHere, setForceLastHere] = useState(false);

    // hydrate tutorial progress from storage and merge
    useEffect(() => {
        loadProgress().then((stored) => {
            setTutorial((prev) => {
                const merged = { ...prev, ...stored };
                // if we arrived explicitly for teaching, ensure swipeWallet true
                if (params?.teach === "1") merged.swipeWallet = true;
                return merged as TutorialProgress;
            });
        });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleSkipStep = (step: TutorialStepKey) => {
        setTutorial((prev) => {
            let next = { ...prev, [step]: true };

            // If user skips walletInfo while staying on Wallet, we want to show "last" HERE.
            // To reach "last", both wallet tasks must be completed.
            if (step === "walletInfo") {
                next = { ...next, dragCoin: true }; // ensure dragCoin is also done
                setForceLastHere(true); // override overlay gating so "last" can show in Wallet
                saveProgress({ walletInfo: true, dragCoin: true });
                return next;
            }

            // default: persist the single step
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
        await AsyncStorage.setItem("tutorial.done", "1"); // ensure global done
        saveProgress(all);
    };

    // screen-wide back swipe: restrict to LEFT EDGE so it doesn't steal coin drags
    const screenSwipe = useRef(
        PanResponder.create({
            // Only start if finger is within the left edge strip
            onStartShouldSetPanResponder: (evt) => {
                // @ts-ignore
                const startX = evt.nativeEvent.pageX ?? 1000;
                return startX < EDGE_BACK_WIDTH;
            },
            onMoveShouldSetPanResponder: (_, g) => {
                const single = (g.numberActiveTouches ?? 1) === 1;
                const horizontal = g.dx > 16 && Math.abs(g.dx) > Math.abs(g.dy);
                return single && horizontal;
            },
            // If child already grabbed it, don't try to take over mid-gesture
            onPanResponderTerminationRequest: () => false,
            onPanResponderRelease: async (_, g) => {
                const absX = Math.abs(g.dx);
                const absY = Math.abs(g.dy);
                if (g.dx > 80 && absX > absY) {
                    // user chose the "swipe back" branch -> mark both walletInfo and dragCoin as done
                    setTutorial((prev) => {
                        const next = { ...prev, walletInfo: true, dragCoin: true };
                        saveProgress({ walletInfo: true, dragCoin: true });
                        return next;
                    });
                    router.replace({
                        pathname: "/coin-flipper",
                        params: { fromWallet: "back" },
                    });
                }
            },
        })
    ).current;

    // Show only first coin in the wallet (if exists)
    const coin = coins[0];

    // Suppress the tutorial on Wallet when both wallet tasks are done,
    // EXCEPT when forceLastHere is set (user skipped walletInfo → show "last" here).
    const walletShouldShowOverlay =
        tutHydrated &&
        !tutorialDone &&
        (forceLastHere || !(tutorial.dragCoin && tutorial.walletInfo));

    return (
        <View style={styles.container} {...screenSwipe.panHandlers}>
            {/* Screen title*/}
            <Text style={styles.walletTitle}>Minu Rahakott</Text>

            {/* If wallet is empty, show prompt */}
            {!coin ? (
                <View style={styles.walletEmptyState}>
                    <Text style={styles.walletEmptyText}>Rahakott on tühi</Text>
                    <Text style={styles.walletEmptySubtext}>
                        Viska münte, et neid lisada rahakotti!
                    </Text>
                </View>
            ) : (
                // If coin exists, show draggable coin centered
                <View style={styles.walletCoinCenterArea}>
                    <DraggableCoin
                        coin={coin}
                        updateCoinPosition={updateCoinPosition}
                        onFirstDrag={() => {
                            if (!tutorial.dragCoin) {
                                const upd = { dragCoin: true };
                                setTutorial((p) => ({ ...p, ...upd }));
                                saveProgress(upd);
                            }
                        }}
                        onTapOpenInfo={() => {
                            // user chose the "walletInfo" path by tapping the coin
                            // Mark both wallet tasks as done so Wallet won’t show "last"
                            const upd = { walletInfo: true, dragCoin: true };
                            setTutorial((p) => ({ ...p, ...upd }));
                            saveProgress(upd);
                            // navigate to flipper; it will show "last"
                            router.replace({
                                pathname: "/coin-flipper",
                                params: { openInfo: "1", coinId: coin.id, fromWallet: "info" },
                            });
                        }}
                    />
                </View>
            )}

            {/* TUTORIAL OVERLAY (wallet steps) */}
            {walletShouldShowOverlay && (
                <FirstRunTutorial
                    progress={tutorial}
                    onSkipStep={handleSkipStep}
                    onSkipAll={handleSkipAll}
                    onFinish={async () => {
                        // back to coin flip page
                        const upd = { last: true };
                        setTutorial((p) => ({ ...p, ...upd }));
                        saveProgress(upd);
                        await AsyncStorage.setItem("tutorial.done", "1"); // await before navigation

                        // IMPORTANT: pass a one-shot param so Coin-Flipper suppresses overlay immediately
                        router.replace({
                            pathname: "/coin-flipper",
                            params: { tutorialDone: "1" },
                        });
                    }}
                />
            )}
        </View>
    );
}

function DraggableCoin({
    coin,
    updateCoinPosition,
    onFirstDrag,
    onTapOpenInfo,
}: {
    coin: any,
    updateCoinPosition: Function,
    onFirstDrag: () => void,
    onTapOpenInfo: () => void,
}) {
    const router = useRouter();

    // Set initial center position, or use coin.x/y if defined
    const initialX = coin.x !== undefined ? coin.x : SCREEN_WIDTH / 2 - 40; // 40 is half coin size
    const initialY = coin.y !== undefined ? coin.y : SCREEN_HEIGHT / 2 - 100; // offset for title area

    // Animation ref for drag position
    const pan = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
    // Keep last dragged position across renders (authoritative absolute coords)
    const lastPosition = useRef({ x: initialX, y: initialY });

    // Initialize offset to stored position when coin changes
    useEffect(() => {
        pan.setOffset({ x: lastPosition.current.x, y: lastPosition.current.y });
        pan.setValue({ x: 0, y: 0 });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [coin?.id]);

    const touchStartTs = useRef<number>(0);
    const movedOnce = useRef<boolean>(false);

    // During drag, animate coin position (kept inline to avoid Fabric non-callable return)
    const handlePanMove = (evt: any, gesture: any) => {
        Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false })(evt, gesture);
    };

    // PanResponder controls drag logic for the coin
    const panResponder = useRef(
        PanResponder.create({
            // Grab as soon as we touch the coin
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,

            // IMPORTANT: capture so parent edge-swipe can't steal once we began
            onStartShouldSetPanResponderCapture: () => true,
            onMoveShouldSetPanResponderCapture: () => true,

            // When user starts dragging, set drag offset to last position and zero deltas
            onPanResponderGrant: () => {
                touchStartTs.current = Date.now();
                movedOnce.current = false;

                // Use the stable pattern: setOffset(lastPosition), setValue(0,0)
                pan.setOffset({
                    x: lastPosition.current.x,
                    y: lastPosition.current.y,
                });
                pan.setValue({ x: 0, y: 0 });
            },

            // During drag, animate coin position
            onPanResponderMove: (evt, gesture) => {
                handlePanMove(evt, gesture);
                if (!movedOnce.current && (Math.abs(gesture.dx) + Math.abs(gesture.dy)) > 4) {
                    movedOnce.current = true;
                    onFirstDrag(); // notify tutorial on first real move
                }
            },

            // When drag released, either tap-to-open or save new position and reset offset
            onPanResponderRelease: (_, gesture) => {
                // Flatten offset to bake the translation into the value
                pan.flattenOffset();

                // Detect quick tap with minimal movement -> open coin info in coin-flipper
                const dt = Date.now() - touchStartTs.current;
                const moved = Math.abs(gesture.dx) + Math.abs(gesture.dy);
                if (dt < 250 && moved < 6) {
                    onTapOpenInfo();
                    return; // navigation is done in onTapOpenInfo above
                }

                // Compute and persist new absolute position
                lastPosition.current = {
                    x: lastPosition.current.x + gesture.dx,
                    y: lastPosition.current.y + gesture.dy,
                };
                updateCoinPosition(coin.id, lastPosition.current.x, lastPosition.current.y);

                // After persisting, reset offset/value so the next drag starts cleanly
                pan.setOffset({ x: lastPosition.current.x, y: lastPosition.current.y });
                pan.setValue({ x: 0, y: 0 });
            },

            // If another responder steals it, keep where we were and reset accounting
            onPanResponderTerminate: (_, gesture) => {
                pan.flattenOffset();
                lastPosition.current = {
                    x: lastPosition.current.x + (gesture?.dx ?? 0),
                    y: lastPosition.current.y + (gesture?.dy ?? 0),
                };
                updateCoinPosition(coin.id, lastPosition.current.x, lastPosition.current.y);
                pan.setOffset({ x: lastPosition.current.x, y: lastPosition.current.y });
                pan.setValue({ x: 0, y: 0 });
            },

            // Don't allow termination while active unless absolutely necessary
            onPanResponderTerminationRequest: () => false,
        })
    ).current;

    // Choose correct image for coin side
    const imageSource = coin.side === CoinSide.HEADS
        ? coin.headImageResource
        : coin.tailsImageResource;

    // Render animated, draggable coin image
    return (
        <Animated.View
            {...panResponder.panHandlers}
            style={[
                styles.walletCoinContainer,
                {
                    position: "absolute",
                    transform: [
                        { translateX: pan.x },
                        { translateY: pan.y }
                    ],
                },
            ]}
        >
            <Image
                source={imageSource}
                style={styles.walletCoinImage}
                resizeMode="contain"
            />
        </Animated.View>
    );
}
