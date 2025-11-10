import React, { useEffect, useMemo, useState } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type TutorialProgress = {
    tapTwice: boolean;
    zoomedIn: boolean;
    rotated: boolean;
    zoomedOut: boolean;
    doubleTapped: boolean;
    openedInfo: boolean;
};

export type TutorialStepKey = "tapTwice" | "zoomedIn" | "rotated" | "zoomedOut" | "doubleTapped" | "openedInfo";

type Props = {
    progress: TutorialProgress;
    onSkipStep: (step: TutorialStepKey) => void;
    onSkipAll: () => void;
    // Optional: override default blue
    primaryColor?: string;
    // Optional: force show (for testing)
    visibleOverride?: boolean;
};

const STORAGE_DONE_KEY = "tutorial.done";
const STORAGE_SKIPS_KEY = "tutorial.skips"; // remembers which steps were skipped

const ORDER: TutorialStepKey[] = ["tapTwice", "zoomedIn", "rotated", "zoomedOut", "doubleTapped", "openedInfo"];

const TEXTS: Record<TutorialStepKey, string> = {
    tapTwice:
        "Kliki mündil, et külge vahetada.\nVaheta külge kaks korda, et näha järgmist juhist.",
    zoomedIn:
        "Suumi münti kahe sõrmega, et vaadata lähemalt.",
    rotated:
        "Pööra münti kahe sõrmega, et vaadata münti eri nurkade alt.",
    zoomedOut:
        "Tee münt väiksemaks, et jätkata .",
    doubleTapped:
        "Tee mündil topeltklikk, et valida ennustus ja visata münti.",
    openedInfo:
        "Libista ekraanil alt äärest üles, et näha mündi infot.",
};

export function FirstRunTutorial({
    progress,
    onSkipStep,
    onSkipAll,
    primaryColor = "#B4CECC",
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
            } catch {}
        })();
    }, []);

    const allComplete = useMemo(() => {
        return ORDER.every((k) => progress[k] || skips[k]);
    }, [progress, skips]);

    // Persist completion
    useEffect(() => {
        if (allComplete && !done) {
            AsyncStorage.setItem(STORAGE_DONE_KEY, "1").catch(() => {});
            setDone(true);
        }
    }, [allComplete, done]);

    // Figure out which step to show
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

    return (
        <Modal visible transparent animationType="fade" onRequestClose={handleSkipAll}>
            <View style={s.backdrop}>
                <View style={[s.card, { borderColor: `${primaryColor}33` }]}>
                    <Text style={[s.title, { color: primaryColor }]}>Kuidas alustada</Text>
                    <Text style={s.text}>{TEXTS[nextStep]}</Text>

                    <View style={s.actions}>
                        <TouchableOpacity onPress={handleSkipStep} style={[s.btnGhost]}>
                            <Text style={[s.btnGhostText, { color: primaryColor }]}>Jäta see samm vahele</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={handleSkipAll} style={[s.btn, { backgroundColor: primaryColor }]}>
                            <Text style={s.btnText}>Jäta õpetus vahele</Text>
                        </TouchableOpacity>
                    </View>

                    <Text style={s.hint}>Jätkamiseks tehke toiming vastavalt juhisele.</Text>
                </View>
            </View>
        </Modal>
    );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 560,
    backgroundColor: "#f4f8ff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 8,
    textAlign: "center",
  },
  text: {
    fontSize: 15,
    color: "#1f2937",
    textAlign: "center",
    lineHeight: 22,
  },
  actions: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 12,
  },
  btn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
  },
  btnText: {
    color: "white",
    fontWeight: "700",
  },
  btnGhost: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 999,
    alignItems: "center",
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "transparent",
  },
  btnGhostText: {
    fontWeight: "700",
  },
  hint: {
    marginTop: 10,
    textAlign: "center",
    color: "#6b7280",
    fontSize: 12,
  },
});
