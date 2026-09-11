import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  DEVELOPER_EMAIL,
  legalDocuments,
  LegalDocumentType,
} from "../legal/content";

type LegalView = "center" | LegalDocumentType;

export function LegalCenterModal({
  visible,
  initialView = "center",
  onClose,
  onWithdrawConsent,
}: {
  visible: boolean;
  initialView?: LegalView;
  onClose: () => void;
  onWithdrawConsent: () => Promise<void>;
}) {
  const [view, setView] = useState<LegalView>(initialView);

  useEffect(() => {
    if (visible) setView(initialView);
  }, [initialView, visible]);

  const document = view === "center" ? null : legalDocuments[view];

  return (
    <Modal
      animationType="slide"
      onRequestClose={() => (document ? setView("center") : onClose())}
      presentationStyle="fullScreen"
      visible={visible}
    >
      <SafeAreaView style={localStyles.safe}>
        <View style={localStyles.header}>
          {document ? (
            <Pressable
              accessibilityLabel="返回关于与隐私"
              hitSlop={10}
              onPress={() => setView("center")}
              style={localStyles.iconButton}
            >
              <Ionicons name="chevron-back" size={24} color="#5b4f4b" />
            </Pressable>
          ) : (
            <View style={localStyles.iconPlaceholder} />
          )}
          <Text style={localStyles.headerTitle}>
            {document?.title ?? "关于与隐私"}
          </Text>
          <Pressable
            accessibilityLabel="关闭"
            hitSlop={10}
            onPress={onClose}
            style={localStyles.iconButton}
          >
            <Ionicons name="close" size={25} color="#5b4f4b" />
          </Pressable>
        </View>

        {document ? (
          <ScrollView
            contentContainerStyle={localStyles.document}
            showsVerticalScrollIndicator={false}
          >
            {document.sections.map((section) => (
              <View key={section.heading} style={localStyles.section}>
                <Text style={localStyles.sectionHeading}>{section.heading}</Text>
                {section.paragraphs.map((paragraph) => (
                  <Text key={paragraph} style={localStyles.paragraph}>
                    {paragraph}
                  </Text>
                ))}
              </View>
            ))}
          </ScrollView>
        ) : (
          <ScrollView contentContainerStyle={localStyles.centerContent}>
            <View style={localStyles.brandMark}>
              <Text style={localStyles.brandMarkText}>X²</Text>
            </View>
            <Text style={localStyles.appName}>X²衣橱</Text>
            <Text style={localStyles.description}>
              本地衣橱整理与穿搭记录工具
            </Text>

            <View style={localStyles.card}>
              <LegalRow
                icon="shield-checkmark-outline"
                label="隐私政策"
                onPress={() => setView("privacy")}
              />
              <View style={localStyles.divider} />
              <LegalRow
                icon="document-text-outline"
                label="用户协议"
                onPress={() => setView("agreement")}
              />
            </View>

            <View style={localStyles.infoCard}>
              <Text style={localStyles.infoLabel}>开发者主体</Text>
              <Text style={localStyles.infoValue}>个人开发者</Text>
              <Text style={[localStyles.infoLabel, localStyles.infoSpacing]}>
                联系邮箱
              </Text>
              <Text selectable style={localStyles.infoValue}>
                {DEVELOPER_EMAIL}
              </Text>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() =>
                Alert.alert(
                  "撤回隐私同意",
                  "撤回后将停止使用应用并返回隐私授权页，本地衣橱数据不会被删除。",
                  [
                    { text: "取消", style: "cancel" },
                    {
                      text: "确认撤回",
                      style: "destructive",
                      onPress: () => void onWithdrawConsent(),
                    },
                  ],
                )
              }
              style={localStyles.withdrawButton}
            >
              <Text style={localStyles.withdrawText}>撤回隐私同意</Text>
            </Pressable>
          </ScrollView>
        )}
      </SafeAreaView>
    </Modal>
  );
}

function LegalRow({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={localStyles.row}>
      <View style={localStyles.rowIcon}>
        <Ionicons name={icon} size={21} color="#a45241" />
      </View>
      <Text style={localStyles.rowLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={20} color="#b8a6a0" />
    </Pressable>
  );
}

const localStyles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#fffaf7" },
  header: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#eadfd9",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 17,
    fontWeight: "600",
    color: "#403735",
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f7eae5",
  },
  iconPlaceholder: { width: 38, height: 38 },
  centerContent: { padding: 24, alignItems: "center", paddingBottom: 44 },
  brandMark: {
    width: 82,
    height: 82,
    borderRadius: 24,
    backgroundColor: "#b8604e",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
    shadowColor: "#7a2e20",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 4,
  },
  brandMarkText: { color: "#fff", fontSize: 31, fontWeight: "700" },
  appName: { color: "#403735", fontSize: 25, fontWeight: "600", marginTop: 16 },
  description: { color: "#8e817c", fontSize: 13, marginTop: 5 },
  card: {
    width: "100%",
    borderRadius: 17,
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    marginTop: 32,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#eadfd9",
  },
  row: { height: 62, flexDirection: "row", alignItems: "center" },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: "#f8ece7",
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: { flex: 1, color: "#4b413e", fontSize: 15, marginLeft: 12 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: "#eee3df", marginLeft: 48 },
  infoCard: {
    width: "100%",
    borderRadius: 17,
    backgroundColor: "#f7eae5",
    padding: 18,
    marginTop: 14,
  },
  infoLabel: { color: "#9b7f76", fontSize: 12 },
  infoValue: { color: "#5b4f4b", fontSize: 14, marginTop: 4 },
  infoSpacing: { marginTop: 16 },
  withdrawButton: { marginTop: 26, paddingVertical: 12, paddingHorizontal: 18 },
  withdrawText: { color: "#a95a4b", fontSize: 13 },
  document: { padding: 22, paddingBottom: 48 },
  section: { marginBottom: 22 },
  sectionHeading: { color: "#403735", fontSize: 16, fontWeight: "600", marginBottom: 8 },
  paragraph: { color: "#655955", fontSize: 14, lineHeight: 23, marginBottom: 8 },
});
