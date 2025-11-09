import React, { useRef } from "react";
import { View, Text, Image, Animated, PanResponder, Dimensions } from "react-native";
import { useWallet } from "../context/wallet-context";
import { styles } from "../components/common/stylesheet";
import { CoinSide } from "../data/entity/coin";

// Get screen dimensions for centering coin
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function Wallet() {
    const { coins, updateCoinPosition } = useWallet();

    // Show only first coin in the wallet (if exists)
    const coin = coins[0];

    return (
        <View style={styles.container}>
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
        />
    </View>
            )}
        </View>
    );
}

function DraggableCoin({ coin, updateCoinPosition }: { coin: any, updateCoinPosition: Function }) {
    // Set initial center position, or use coin.x/y if defined
    const initialX = coin.x !== undefined ? coin.x : SCREEN_WIDTH / 2 - 40; // 40 is half coin size
    const initialY = coin.y !== undefined ? coin.y : SCREEN_HEIGHT / 2 - 100; // offset for title area

    // Animation ref for drag position
    const pan = useRef(new Animated.ValueXY({ x: initialX, y: initialY })).current;
    // Keep last dragged position across renders
    const lastPosition = useRef({ x: initialX, y: initialY });

    // PanResponder controls drag logic for the coin
    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            // When user starts dragging, set drag offset to last position
            onPanResponderGrant: () => {
                pan.setOffset({
                    x: lastPosition.current.x,
                    y: lastPosition.current.y,
                });
                pan.setValue({ x: 0, y: 0 });
            },
            // During drag, animate coin position
            onPanResponderMove: Animated.event(
                [null, { dx: pan.x, dy: pan.y }],
                { useNativeDriver: false },
            ),
            // When drag released, save new position to wallet and reset offset
            onPanResponderRelease: (_, gesture) => {
                pan.flattenOffset();
                lastPosition.current = {
                    x: lastPosition.current.x + gesture.dx,
                    y: lastPosition.current.y + gesture.dy,
                };
                updateCoinPosition(coin.id, lastPosition.current.x, lastPosition.current.y);
            },
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
