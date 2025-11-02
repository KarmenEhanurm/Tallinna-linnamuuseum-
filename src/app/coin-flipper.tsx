import { useState, useRef } from "react";
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
import { TapGestureHandler, State } from "react-native-gesture-handler";
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
    const flipAnimation = useRef(new Animated.Value(0)).current;
    const coin = new CoinService().generateNewCoin();

    const [isDialogVisible, setIsDialogVisible] = useState(false);
    const [pendingPrediction, setPendingPrediction] = useState<CoinSide | null>(null);
    const [lastResult, setLastResult] = useState<CoinSide | null>(null);

    // --- Bottom sheet state ---
    const [isInfoVisible, setIsInfoVisible] = useState(false);
    const bottomSheetAnim = useRef(new Animated.Value(0)).current;
    const dragY = useRef(new Animated.Value(0)).current;

    // --- Flip coin logic ---
    const flipCoin = async () => {
        const MAX_ROTATIONS = 30;
        const MIN_ROTATIONS = 15;
        const rotations = Math.max(Math.floor(Math.random() * MAX_ROTATIONS) + 1, MIN_ROTATIONS);
        const duration = 1500;
        setLastResult(null);

        Animated.timing(flipAnimation, {
        toValue: rotations,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
        }).start(() => {
        setFlipped(1);
        flipAnimation.setValue(0);
        Toast.show({
            type: "success",
            text1: "Münt on lisatud rahakotti",
            text2: `Münt '${coin.title}' on lisatud teie rahakotti 🪙`,
        });
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
        Animated.timing(bottomSheetAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
        }).start();
    };

    const closeInfoSheet = () => {
        Animated.timing(bottomSheetAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
        }).start(() => setIsInfoVisible(false));
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
            {...sheetPanResponder.panHandlers}
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

        </View>
    );
    }
