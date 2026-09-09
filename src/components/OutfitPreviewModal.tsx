import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Outfit } from "../types";
import { OutfitCanvas } from "./OutfitCanvas";

export function OutfitPreviewModal({
  outfit,
  onClose,
}: {
  outfit: Outfit | null;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={Boolean(outfit)}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={previewStyles.backdrop} onPress={onClose}>
        <View style={previewStyles.content} pointerEvents="none">
          {outfit && <OutfitCanvas outfit={outfit} />}
          <Text style={previewStyles.hint}>再次点击关闭预览</Text>
        </View>
      </Pressable>
    </Modal>
  );
}

const previewStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 12, 11, 0.96)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  content: {
    width: "100%",
    maxWidth: 430,
    alignItems: "center",
  },
  hint: {
    color: "rgba(255,255,255,0.72)",
    fontSize: 13,
    marginTop: 18,
  },
});
