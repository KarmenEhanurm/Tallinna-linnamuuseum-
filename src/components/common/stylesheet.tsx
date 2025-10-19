/**
 * This file contains the common stylesheet used throughout the application
 */
import { Dimensions, StyleSheet } from "react-native";

const { width } = Dimensions.get("window");
const CARD_WIDTH = Math.min(168, Math.floor((width - 64) / 2));


export const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center"
    },
    coinImage: {
        width: 200,
        height: 200,
    },
    bottomArea: {
        flex: 1,
        alignItems: "center",
        paddingTop: 12,
    },
    resultText: {
        fontWeight: "700"
    },
    modalBackdrop: {
        flex: 1,
        backgroundColor: "#1918188c",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
    },
    modalCard: {
        width: "100%",
        maxWidth: 540,
        backgroundColor: "#1c1d1fff",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#ffffff0f",
    },
    modalTitle: {
        color: "#ffffff",
        fontSize: 18,
        fontWeight: "700",
        textAlign: "center",
        marginBottom: 12,
    },
    choicesRow: {
        width: "100%",
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 12,
    },
    choiceCard: {
        width: CARD_WIDTH,
        alignItems: "center",
        backgroundColor: "#131418ff",
        borderRadius: 14,
        padding: 12,
        borderWidth: 1,
        borderColor: "#ffffff14",
        marginHorizontal: 6,
    },
    choiceImage: {
        width: CARD_WIDTH - 24,
        height: CARD_WIDTH - 24,
        marginBottom: 10
    },
    choiceLabel: {
        color: "#ffffffff",
        fontWeight: "600" },
    separator: {
        height: 1,
        backgroundColor: "#ffffff14",
        marginVertical: 10 },
    skipBtn: {
        alignSelf: "center",
        backgroundColor: "#2f6feb",
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 999,
    },
    skipBtnText: {
        color: "#ffffffff",
        fontWeight: "700" },
    closeBtn: {
        alignSelf: "center",
        marginTop: 10,
        padding: 8 },
    closeBtnText: {
        color: "#b0b5baff",
        fontWeight: "600" },
});