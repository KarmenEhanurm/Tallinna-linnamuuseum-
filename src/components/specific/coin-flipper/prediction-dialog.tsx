import { Image, Modal, Pressable, Text, TouchableOpacity, View } from "react-native"
import { styles } from "../../common/stylesheet"

export default function PredictionDialog(
    {visible, onCloseDialog, onPredictHeads, onPredictTails, onWithoutPrediction, headImageURI, tailsImageURI}:
    {
        visible: boolean,
        onCloseDialog: () => void,
        onPredictHeads: () => void,
        onPredictTails: () => void,
        onWithoutPrediction: () => void,
        headImageURI?: string,
        tailsImageURI?: string
    }
) {
    return (
        <Modal
            visible={visible}
            animationType="fade"
            transparent
            onRequestClose={onCloseDialog}
        >
            <View style={styles.modalBackdrop}>
                <View style={styles.modalCard}>
                    <Text style={styles.modalTitle}>Vali oma ennustus</Text>

                    <View style={styles.choicesRow}>
                        {/* Heads choice */}
                        <Pressable
                            style={styles.choiceCard}
                            onPress={onPredictHeads}
                            accessibilityRole="button"
                        >
                            <Image
                                source={{uri: headImageURI}}
                                style={styles.choiceImage}
                                resizeMode="contain"
                            />
                            <Text style={styles.choiceLabel}>Kull</Text>
                        </Pressable>

                        {/* Tails choice */}
                        <Pressable
                            style={styles.choiceCard}
                            onPress={onPredictTails}
                            accessibilityRole="button"
                        >
                            <Image
                                source={{uri: tailsImageURI}}
                                style={styles.choiceImage}
                                resizeMode="contain"
                            />
                            <Text style={styles.choiceLabel}>Kiri</Text>
                        </Pressable>
                    </View>

                    <View style={styles.separator} />

                    {/* Skip: close modal and flip */}
                    <TouchableOpacity onPress={onWithoutPrediction} style={styles.skipBtn}>
                        <Text style={styles.skipBtnText}>Viska ilma ennustuseta</Text>
                    </TouchableOpacity>

                    {/* Close: close modal without flipping */}
                    <TouchableOpacity onPress={onCloseDialog} style={styles.closeBtn}>
                        <Text style={styles.closeBtnText}>Sulge</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    )

}