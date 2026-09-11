import { Ionicons } from "@expo/vector-icons";
import {
  BackHandler,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LegalDocumentType } from "../legal/content";

export function PrivacyConsentModal({
  visible,
  onAccept,
  onOpenDocument,
}: {
  visible: boolean;
  onAccept: () => void;
  onOpenDocument: (document: LegalDocumentType) => void;
}) {
  function decline() {
    if (Platform.OS === "android") BackHandler.exitApp();
  }

  return (
    <Modal
      animationType="fade"
      onRequestClose={decline}
      statusBarTranslucent
      transparent
      visible={visible}
    >
      <SafeAreaView style={localStyles.shade}>
        <View style={localStyles.dialog}>
          <View style={localStyles.icon}>
            <Ionicons name="shield-checkmark-outline" size={28} color="#b8604e" />
          </View>
          <Text style={localStyles.title}>欢迎使用 X²衣橱</Text>
          <Text style={localStyles.body}>
            为保障你的权益，请在使用前阅读并同意用户协议与隐私政策。
          </Text>

          <View style={localStyles.summary}>
            <Text style={localStyles.summaryText}>• 衣物图片和穿搭记录仅保存在本机</Text>
            <Text style={localStyles.summaryText}>• 仅在你主动拍照或选图时申请相应权限</Text>
            <Text style={localStyles.summaryText}>• 当前无账号、云同步、广告和行为统计</Text>
          </View>

          <Text style={localStyles.confirmText}>
            点击“同意并进入”代表你已阅读并同意
          </Text>
          <View style={localStyles.links}>
            <Pressable onPress={() => onOpenDocument("agreement")}>
              <Text style={localStyles.link}>《用户协议》</Text>
            </Pressable>
            <Text style={localStyles.and}>与</Text>
            <Pressable onPress={() => onOpenDocument("privacy")}>
              <Text style={localStyles.link}>《隐私政策》</Text>
            </Pressable>
          </View>

          <Pressable accessibilityRole="button" onPress={onAccept} style={localStyles.accept}>
            <Text style={localStyles.acceptText}>同意并进入</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={decline} style={localStyles.decline}>
            <Text style={localStyles.declineText}>
              {Platform.OS === "android" ? "不同意并退出" : "暂不同意"}
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const localStyles = StyleSheet.create({
  shade: {
    flex: 1,
    justifyContent: "center",
    padding: 24,
    backgroundColor: "rgba(45, 35, 31, 0.56)",
  },
  dialog: {
    borderRadius: 24,
    backgroundColor: "#fffaf7",
    padding: 24,
    shadowColor: "#3f2922",
    shadowOpacity: 0.24,
    shadowRadius: 20,
    elevation: 10,
  },
  icon: {
    width: 52,
    height: 52,
    borderRadius: 17,
    backgroundColor: "#f7eae5",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  title: { color: "#403735", fontSize: 21, fontWeight: "600", textAlign: "center", marginTop: 14 },
  body: { color: "#6f625e", fontSize: 14, lineHeight: 22, textAlign: "center", marginTop: 10 },
  summary: { backgroundColor: "#f8efeb", borderRadius: 14, padding: 14, marginTop: 17, gap: 8 },
  summaryText: { color: "#665955", fontSize: 13, lineHeight: 20 },
  confirmText: { color: "#8e817c", fontSize: 12, textAlign: "center", marginTop: 18 },
  links: { flexDirection: "row", alignItems: "center", justifyContent: "center", marginTop: 5 },
  link: { color: "#a64f3e", fontSize: 13, fontWeight: "600" },
  and: { color: "#8e817c", fontSize: 12 },
  accept: {
    height: 49,
    borderRadius: 15,
    backgroundColor: "#b8604e",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 19,
  },
  acceptText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  decline: { height: 43, alignItems: "center", justifyContent: "center", marginTop: 3 },
  declineText: { color: "#857873", fontSize: 13 },
});
