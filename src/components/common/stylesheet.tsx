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
        backgroundColor: "#00000096",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
    },
    modalCard: {
        width: "100%",
        maxWidth: 540,
        backgroundColor: "#f4f4f4ff",
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: "#ffffff0f",
    },
    modalTitle: {
        color: "#91603A",
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
        backgroundColor: "#e4e4e4ff",
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
        color: "#91603A",
        fontWeight: "600" },
    separator: {
        height: 1,
        backgroundColor: "#ffffff14",
        marginVertical: 10 },
    skipBtn: {
        alignSelf: "center",
        backgroundColor: "#B4CECC",
        paddingHorizontal: 18,
        paddingVertical: 10,
        borderRadius: 999,
    },
    skipBtnText: {
        color: "#2b2b2bff",
        fontWeight: "700" },
    closeBtn: {
        alignSelf: "center",
        marginTop: 10,
        padding: 8 },
    closeBtnText: {
        color: "#747678ff",
        fontWeight: "600" },

    // Bottom Sheet Styles    
    bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(255, 255, 255, 0.85)", // ← semi-transparent white
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 10,
    paddingBottom: 40,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: -3 },
    shadowRadius: 6,
    elevation: 10,
    },

    sheetHeader: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    },

    sheetHandle: {
    width: 60,
    height: 5,
    backgroundColor: "#ccc",
    borderRadius: 3,
    marginVertical: 10,
    },

    sheetCloseBtn: {
    position: "absolute",
    right: 20,
    top: 0,
    padding: 10,
    },

    sheetCloseIcon: {
    fontSize: 18,
    color: "#333",
    },

    infoCard: {
    backgroundColor: "rgba(173, 216, 216, 0.7)",
    borderRadius: 20,
    padding: 15,
    marginTop: 12,
    },

    infoTitle: {
    fontWeight: "600",
    fontSize: 16,
    marginBottom: 6,
    },

    infoValue: {
    fontSize: 15,
    lineHeight: 22,
    color: "#000",
    },

});