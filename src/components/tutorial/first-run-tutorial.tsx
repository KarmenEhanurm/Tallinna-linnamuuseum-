import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { styles } from "../common/stylesheet";

export type TutorialProgress = {
    tapTwice: boolean;
    zoomedIn: boolean;
    rotated: boolean;
    zoomedOut: boolean;
    doubleTapped: boolean;
    openedInfo: boolean;
    swipeWallet: boolean;
    dragCoin: boolean;
    walletInfo: boolean;
};

export type TutorialStepKey = "tapTwice" | "zoomedIn" | "rotated" | "zoomedOut" | "doubleTapped" | "openedInfo" | "swipeWallet" | "dragCoin" | "walletInfo";

type Props = {
    progress: TutorialProgress;
    onSkipStep: (step: TutorialStepKey) => void;
    onSkipAll: () => void;
    // Optional: force show (for testing)
    visibleOverride?: boolean;
};

const STORAGE_DONE_KEY = "tutorial.done";
const STORAGE_SKIPS_KEY = "tutorial.skips";

const ORDER: TutorialStepKey[] = ["tapTwice", "zoomedIn", "rotated", "zoomedOut", "doubleTapped", "openedInfo", "swipeWallet", "dragCoin", "walletInfo"];

const TEXTS: Record<TutorialStepKey, string> = {
    tapTwice:
        "Kliki mündil, et külge vahetada.\nVaheta külge kaks korda, et näha järgmist juhist.",
    zoomedIn:
        "Suumi münti kahe sõrmega, et vaadata lähemalt.",
    rotated:
        "Pööra münti kahe sõrmega, et vaadata münti eri nurkade alt.",
    zoomedOut:
        "Muuda münt tagasi algsuurusesse, et jätkata.",
    doubleTapped:
        "Tee mündil topeltklikk, et valida ennustus ja visata münti.",
    openedInfo:
        "Libista ekraanil alt äärest üles, et näha mündi infot.",
    swipeWallet:
        "Libista ekraanil paremalt vasakule, et avada rahakott.",
    dragCoin:
        "Lohista münti mööda ekraani.",
    walletInfo:
        "Rahakotis mündile vajutades liigud tagasi mündi info juurde.\nKui tahad uut münti visata, libista ekraanil vasakult paremale.",
};

export function FirstRunTutorial({
    progress,
    onSkipStep,
    onSkipAll,
    visibleOverride,
}: Props) {
    const [done, setDone] = useState<boolean>(false);
    const [skips, setSkips] = useState<Record<TutorialStepKey, boolean>>({
        tapTwice: false,
        zoomedIn: false,
        rotated: false,
        zoomedOut: false,
        doubleTapped: false,
        openedInfo: false,
        swipeWallet: false,
        dragCoin: false,
        walletInfo: false,
    });

    // Load persisted flags once
    useEffect(() => {
        (async () => {
        try {
            const rawDone = await AsyncStorage.getItem(STORAGE_DONE_KEY);
            const rawSkips = await AsyncStorage.getItem(STORAGE_SKIPS_KEY);
            if (rawDone === "1") setDone(true);
            if (rawSkips) {
                const parsed = JSON.parse(rawSkips);
                setSkips((prev) => ({ ...prev, ...parsed }));
            }
        } catch {
            // ignore
        }
        })();
    }, []);

    const allComplete = useMemo(
        () => ORDER.every((k) => progress[k] || skips[k]),
        [progress, skips]
    );

    // Persist completion
    useEffect(() => {
        if (allComplete && !done) {
            AsyncStorage.setItem(STORAGE_DONE_KEY, "1").catch(() => {});
            setDone(true);
        }
    }, [allComplete, done]);

    // Which step to show
    const nextStep: TutorialStepKey | null = useMemo(() => {
        if (done) return null;
        for (const k of ORDER) {
        if (!progress[k] && !skips[k]) return k;
        }
        return null;
    }, [progress, skips, done]);

    const visible = visibleOverride ?? (!!nextStep && !done);
    if (!visible || !nextStep) return null;

    const handleSkipStep = async () => {
        const updated = { ...skips, [nextStep]: true };
        setSkips(updated);
        try {
            await AsyncStorage.setItem(STORAGE_SKIPS_KEY, JSON.stringify(updated));
        } catch {}
        onSkipStep(nextStep);
    };

    const handleSkipAll = async () => {
        setDone(true);
        try {
            await AsyncStorage.setItem(STORAGE_DONE_KEY, "1");
        } catch {}
        onSkipAll();
    };

    // Non-blocking overlay (NO Modal): allows gestures through, card is interactive.
    return (
        <View style={styles.tutorialOverlay} pointerEvents="box-none">

        {/* The card itself at the top, centered horizontally */}
        <View
            style={[
            styles.tutorialCard,
            ]}
            pointerEvents="auto"
        >
            <Text style={styles.tutorialTitle}>Kuidas alustada</Text>
            <Text style={styles.tutorialText}>{TEXTS[nextStep]}</Text>

            {/* Bottom-right: skip current step */}
            <View style={styles.tutorialActions}>
            <TouchableOpacity
                onPress={handleSkipStep}
                style={styles.tutorialSkipStepBtn}
                accessibilityLabel="Jäta see samm vahele"
            >
                <Text style={styles.tutorialSkipStepText}>Jäta samm vahele</Text>
            </TouchableOpacity>
            </View>

            {/* Top-right global close (Jäta õpetus vahele = X) */}
            <TouchableOpacity
                onPress={handleSkipAll}
                style={styles.tutorialClose}
                accessibilityLabel="Jäta õpetus vahele"
            >
                <Text style={styles.tutorialCloseText}>×</Text>
            </TouchableOpacity>
        </View>
    </View>
    );
}
