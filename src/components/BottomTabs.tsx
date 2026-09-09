import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Tab } from "../navigation/types";
import { styles } from "../styles";

export function BottomTabs({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (tab: Tab) => void;
}) {
  const insets = useSafeAreaInsets();
  const tabs: {
    key: Tab;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
  }[] = [
    { key: "home", label: "主页", icon: "home-outline" },
    { key: "style", label: "搭配", icon: "body-outline" },
    { key: "collection", label: "收藏", icon: "heart-outline" },
  ];
  return (
    <View
      style={[styles.tabbar, { paddingBottom: Math.max(insets.bottom, 12) }]}
    >
      {tabs.map((tab) => (
        <Pressable
          key={tab.key}
          style={styles.tab}
          onPress={() => onChange(tab.key)}
        >
          <Ionicons
            name={tab.icon}
            size={22}
            color={active === tab.key ? "#b8604e" : "#9b918e"}
          />
          <Text
            style={[styles.tabText, active === tab.key && styles.activeTabText]}
          >
            {tab.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
