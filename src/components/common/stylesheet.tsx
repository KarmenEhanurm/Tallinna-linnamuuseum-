/**
 * This file contains the common stylesheet used throughout the application
 */
import { Dimensions, StyleSheet } from "react-native";

export const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "rgb(23, 24, 35)",
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
        fontWeight: "700",
        color: "#e7e3e3ff",
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
        backgroundColor: "#ccd9d5ff",
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
        flexWrap: "wrap",
        justifyContent: "space-between",
        rowGap: 12,
        columnGap: 12,
        marginBottom: 12,
    },
    choiceCard: {
        flexBasis: "48%",
        maxWidth: "48%",
        minWidth: 120, // safety for very small phones
        alignItems: "center",
        backgroundColor: "rgb(23, 24, 35)",
        borderRadius: 14,
        padding: 12,
        borderWidth: 1,
        borderColor: "#ffffff14",
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
    backgroundColor: "rgba(23, 24, 35, 0.85)", // ← semi-transparent white
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
    fontWeight: "100",
    fontSize: 16,
    marginBottom: 6,
    },

    infoValue: {
    fontSize: 15,
    lineHeight: 22,
    color: "#000",
    },

// Wallet Styles
        walletTitle: {
        fontSize: 28,
        fontWeight: "700",
        textAlign: "center",
        marginTop: 20,
        marginBottom: 8,
        color: "#e7e3e3ff",
    },
    walletSubtitle: {
        fontSize: 16,
        textAlign: "center",
        marginBottom: 16,
        color: "#caccceff",
        fontWeight: "500",
    },
    walletArea: {
        flex: 1,
        backgroundColor: "rgb(23, 24, 35)",
        margin: 16,
        borderRadius: 16,
        position: "relative",
        overflow: "hidden",
    },
    walletCoinContainer: {
        position: "absolute",
        width: 80,
        height: 80,
        zIndex: 10,
    },
    walletCoinImage: {
        width: 80,
        height: 80,
    },
    walletEmptyState: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    walletEmptyText: {
        fontSize: 20,
        fontWeight: "600",
        color: "#d68f59ff",
        marginBottom: 8,
    },
    walletEmptySubtext: {
        fontSize: 14,
        color: "#747678",
    },
    walletCoinCenterArea: {
        flex: 1,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Tutorial overlay (first run)
    tutorialOverlay: {
        position: "absolute",
        top: 0, left: 0, right: 0,
        // don't cover bottom so user can swipe from bottom edge comfortably
        alignItems: "center",
        justifyContent: "flex-start",
        paddingTop: 12,
        paddingHorizontal: 12,
    },
    tutorialCard: {
        width: "100%",
        maxWidth: 560,
        backgroundColor: "#B4CECC",
        borderRadius: 16,
        padding: 16,
        paddingTop: 20,
        borderWidth: 1,
        borderColor: "#ffffff0f",
        // subtle elevation
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
        elevation: 3,
    },
    tutorialTitle: {
        color: "#2b2b2bff",
        fontSize: 16,
        fontWeight: "800",
        textAlign: "center",
        marginBottom: 6,
    },
    tutorialText: {
        fontSize: 14,
        color: "#2b2b2bff",
        textAlign: "center",
        lineHeight: 20,
        paddingRight: 44,
        paddingLeft: 44,
    },
    tutorialActions: {
        marginTop: 10,
        width: "100%",
        alignItems: "flex-end",
    },
    tutorialSkipStepBtn: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 999,
        backgroundColor: "transparent",
    },
    tutorialSkipStepText: {
        color: "#91603A",
        fontWeight: "700",
    },
    tutorialClose: {
        position: "absolute",
        right: 8,
        top: 8,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: "#B4CECC",
        alignItems: "center",
        justifyContent: "center",
    },
    tutorialCloseText: {
        color: "#2b2b2bff",
        fontSize: 20,
        fontWeight: "800",
        lineHeight: 20,
    },
});