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
    last: boolean,
};

export type TutorialStepKey = "tapTwice" | "zoomedIn" | "rotated" | "zoomedOut" | "doubleTapped" | "openedInfo" | "swipeWallet" | "dragCoin" | "walletInfo" | "last";

type Props = {
    progress: TutorialProgress;
    onSkipStep: (step: TutorialStepKey) => void;
    onSkipAll: () => void;
    // Optional: force show (for testing)
    visibleOverride?: boolean;
    // Optional: called when the final screen's CTA ("Mine mängima") is pressed
    onFinish?: () => void;
};

const STORAGE_DONE_KEY = "tutorial.done";
const STORAGE_SKIPS_KEY = "tutorial.skips";

const ORDER: TutorialStepKey[] = ["tapTwice", "zoomedIn", "rotated", "zoomedOut", "doubleTapped", "openedInfo", "swipeWallet", "dragCoin", "walletInfo", "last"];

const TEXTS: Record<TutorialStepKey, string> = {
    tapTwice:
        "Kliki mündil, et külge vahetada.\nVaheta külge kaks korda, et näha järgmist juhist.",
    zoomedIn:
        "Suurenda münti kahe sõrmega, et vaadata lähemalt.",
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
    last:
        "Oled valmis!\nHead mündi viskamist ja ajaloo avastamist!",
};

export function FirstRunTutorial({
    progress,
    onSkipStep,
    onSkipAll,
    visibleOverride,
    onFinish,
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
        last: false,
    });

    // top-level component state
    const [hydrated, setHydrated] = useState(false);

    // Load persisted flags once
    useEffect(() => {
        (async () => {
            try {
                const rawDone = await AsyncStorage.getItem(STORAGE_DONE_KEY);
                const rawSkips = await AsyncStorage.getItem(STORAGE_SKIPS_KEY);
                // in the first useEffect after loading AsyncStorage:
                if (rawDone === "1") setDone(true);
                if (rawSkips) setSkips((prev) => ({ ...prev, ...JSON.parse(rawSkips) }));
            } catch {
                // ignore
            } finally {
                setHydrated(true); // mark loaded
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

    const visible = hydrated && (visibleOverride ?? (!!nextStep && !done));
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
                {nextStep === "tapTwice" && (<Text style={styles.tutorialTitle}>Kuidas alustada</Text>)}
                <Text style={styles.tutorialText}>{TEXTS[nextStep]}</Text>

                {/* Last step CTA */}
                {nextStep === "last" && (
                    <View style={styles.tutorialActions}>
                        <TouchableOpacity
                            onPress={async () => {
                                // Mark last as skipped in local storage so it does not show again
                                const updated = { ...skips, last: true };
                                setSkips(updated);
                                try {
                                    await AsyncStorage.setItem(STORAGE_SKIPS_KEY, JSON.stringify(updated));
                                    await AsyncStorage.setItem(STORAGE_DONE_KEY, "1"); // ← await to avoid race
                                } catch {}
                                // Let parent decide where to go
                                onFinish?.();
                            }}
                            style={styles.tutorialSkipStepBtn}
                            accessibilityLabel="Mine mängima"
                        >
                            <Text style={styles.tutorialSkipStepText}>Mine mängima</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Bottom-right: skip current step */}
                {nextStep !== "last" && (
                    <View style={styles.tutorialActions}>
                        <TouchableOpacity
                            onPress={handleSkipStep}
                            style={styles.tutorialSkipStepBtn}
                            accessibilityLabel="Jäta samm vahele"
                        >
                            <Text style={styles.tutorialSkipStepText}>Jäta samm vahele</Text>
                        </TouchableOpacity>
                    </View>
                )}

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
