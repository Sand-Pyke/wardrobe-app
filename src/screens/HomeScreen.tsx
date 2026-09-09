import { Ionicons } from "@expo/vector-icons";
import { Image, Pressable, ScrollView, Text, View } from "react-native";
import { CLOTHING_CATEGORIES, ClothingCategory } from "../constants";
import { ClothingItem } from "../types";
import { Empty } from "../components/Empty";
import { styles } from "../styles";

export function Home({
  items,
  onAdd,
  onOpenCategory,
}: {
  items: ClothingItem[];
  onAdd: (c?: ClothingCategory) => void;
  onOpenCategory: (c: ClothingCategory) => void;
}) {
  const groups = CLOTHING_CATEGORIES.map((category) => ({
    ...category,
    entries: items
      .filter((item) => item.category === category.value)
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .slice(0, 4),
  })).filter((group) => group.entries.length);
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.topline}>
        <View>
          <Text style={styles.eyebrow}>MY WARDROBE</Text>
          <Text style={styles.title}>阿雪的衣柜</Text>
        </View>
        <Pressable
          accessibilityLabel="新增衣物"
          style={styles.roundAdd}
          onPress={() => onAdd()}
        >
          <Ionicons name="add" size={27} color="#fff" />
        </Pressable>
      </View>
      {groups.length === 0 ? (
        <Empty
          icon="shirt-outline"
          title="空空如也"
          body="快来打造你的衣柜吧 💪"
          action="添加第一件衣物"
          onPress={() => onAdd()}
        />
      ) : (
        groups.map((group) => (
          <View key={group.value} style={styles.section}>
            <View style={styles.sectionHead}>
              <View>
                <Text style={styles.sectionTitle}>{group.label}</Text>
                {"tip" in group && (
                  <Text style={styles.tip}>{group.tip}</Text>
                )}
              </View>
              {group.entries.length === 4 && (
                <Pressable onPress={() => onOpenCategory(group.value)}>
                  <Text style={styles.more}>
                    更多 <Ionicons name="chevron-forward" />
                  </Text>
                </Pressable>
              )}
            </View>
            <View style={styles.row}>
              {group.entries.slice(0, 3).map((item) => (
                <Pressable
                  key={item.id}
                  style={styles.itemCard}
                  onPress={() => onOpenCategory(group.value)}
                >
                  <Image
                    source={{ uri: item.imageUris[0] }}
                    style={styles.itemImage}
                  />
                </Pressable>
              ))}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}


