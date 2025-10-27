import { useState, useRef, useEffect } from "react";
import {
    View,
    Text,
    Animated,
    Easing,
    Button,
    ActivityIndicator
} from "react-native";
import { TapGestureHandler, State } from "react-native-gesture-handler"; // for double-tap
import { coinService } from "../service/coin-service";
import { Coin, CoinSide } from "../data/entity/coin";
import { styles } from "../components/common/stylesheet";
import { BottomArea } from "../components/specific/coin-flipper/bottom-area";
import Toast from 'react-native-toast-message';
import PredictionDialog from "../components/specific/coin-flipper/prediction-dialog";
import { SafeAreaProvider } from "react-native-safe-area-context";

export default function Flipper() {
    // The coin which is actually going to be used
    const [coin, setCoin] = useState<Coin | null>(null);
    const [coinSize, setCoinSize] = useState<number>(200);

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

    // betting dialog state
    const [ isDialogVisible, setIsDialogVisible ] = useState(false);
    const [ pendingPrediction, setPendingPrediction ] = useState<CoinSide | null>(null);

    // Result of the last completed flip (null until the first flip finishes)
    const [ lastResult, setLastResult ] = useState<CoinSide | null>(null);

    const fetchData = async () => {
        setCoin(null)
        setLastResult(null)
        setPendingPrediction(null)
        const generatedCoin = await coinService.generateNewCoin();
        setCoin(generatedCoin);
        setCoinSize(160 * generatedCoin.diameterMm / 25.4)
    };

    useEffect(() => {
        fetchData();
    }, [])

    // Coin flip logic and animation
    let flipCoin = async () => {
        // Animation parameters
        const MAX_ROTATIONS = 30; // maximum amount of rotations the coin can do
        const MIN_ROTATIONS = 15;
        const rotations = Math.max(Math.floor(Math.random() * MAX_ROTATIONS) + 1, MIN_ROTATIONS);
        const duration = Math.floor(Math.random() * (500 + 1)) + 1000; // milliseconds

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

            // Show notification that the coin has been added to the wallet
            Toast.show({
                type: "success",
                text1: "Münt on lisatud rahakotti",
                text2: `Münt '${coin?.title}' on lisatud teie rahakotti 🪙`
            });
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
        <SafeAreaProvider style={styles.container}>
            {coin === null &&
                <ActivityIndicator size={64}/>
            }
            {coin !== null && (
            <>
                <View>
                    <Text style={
                        styles.titleText
                    }>{coin.title.charAt(0).toLocaleUpperCase() + coin?.title.slice(1)}</Text>
                    <Button
                        onPress={fetchData}
                        title="Uus"
                    />
                </View>
                {/* top spacer keeps coin centered even when result appears */}
                <View style={{ flex: 1 }} />
                {/* Wrap the coin in a TapGestureHandler to detect double-tap for the betting dialog */}
                <TapGestureHandler numberOfTaps={2} onHandlerStateChange={onCoinDoubleTap}>
                    <Animated.Image
                        source={{
                            uri: coinSide === CoinSide.HEADS ? coin.headImageResource : coin.tailsImageResource
                        }}
                        style={[
                            {
                                width: coinSize,
                                height: coinSize
                            },
                            {
                                // apply flip animation using rotateX
                                transform: [
                                    {
                                        scaleY: flipped
                                    },
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
                </TapGestureHandler>

                {/* bottom area holds the result; coin remains centered because top & bottom flex are equal */}

                <View style={styles.bottomArea}>
                    {(lastResult !== null) && (
                        <BottomArea side={lastResult} predicted={pendingPrediction}></BottomArea>
                    )}
                </View>

                <PredictionDialog
                    visible={isDialogVisible}
                    onCloseDialog={() => setIsDialogVisible(false)}
                    onPredictHeads={() => handleChoosePrediction(CoinSide.HEADS)}
                    onPredictTails={() => handleChoosePrediction(CoinSide.TAILS)}
                    onWithoutPrediction={handleFlipWithoutPrediction}
                    headImageURI={coin.headImageResource}
                    tailsImageURI={coin.tailsImageResource}
                />
            </>
            )}
        </SafeAreaProvider>
    )
}


