import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  Image,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { CLOTHING_CATEGORIES, ClothingCategory } from "../constants";
import { ClothingItem } from "../types";
import { Empty } from "../components/Empty";
import { styles } from "../styles";
import { ZoomableImageModal } from "../components/ZoomableImageModal";

export function Home({
  items,
  onAdd,
  onOpenLegal,
  onOpenCategory,
  onReplaceImage,
}: {
  items: ClothingItem[];
  onAdd: (c?: ClothingCategory) => void;
  onOpenLegal: () => void;
  onOpenCategory: (c: ClothingCategory) => void;
  onReplaceImage: (itemId: string, imageUri: string) => Promise<void>;
}) {
  const { width } = useWindowDimensions();
  const [previewItemId, setPreviewItemId] = useState<string | null>(null);
  const previewCardWidth = (width - 60) / 3;
  const previewItem =
    items.find((item) => item.id === previewItemId) ?? null;
  const groups = CLOTHING_CATEGORIES.map((category) => ({
    ...category,
    entries: items
      .filter((item) => item.category === category.value)
      .sort((a, b) => a.sortOrder - b.sortOrder),
  })).filter((group) => group.entries.length);
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.topline}>
        <View>
          <Text style={styles.eyebrow}>MY WARDROBE</Text>
          <Text style={styles.title}>X²衣橱</Text>
        </View>
        <View style={styles.homeHeaderActions}>
          <Pressable
            accessibilityLabel="关于与隐私"
            style={styles.roundInfo}
            onPress={onOpenLegal}
          >
            <Ionicons name="information-outline" size={22} color="#9e5848" />
          </Pressable>
          <Pressable
            accessibilityLabel="新增衣物"
            style={styles.roundAdd}
            onPress={() => onAdd()}
          >
            <Ionicons name="add" size={27} color="#fff" />
          </Pressable>
        </View>
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
              {group.entries.length > 3 && (
                <Pressable onPress={() => onOpenCategory(group.value)}>
                  <Text style={styles.more}>
                    更多 <Ionicons name="chevron-forward" />
                  </Text>
                </Pressable>
              )}
            </View>
            {group.entries.length > 3 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.homeImageScroller}
              >
                {group.entries.map((item) => (
                  <Pressable
                    key={item.id}
                    style={[styles.homePreviewCard, { width: previewCardWidth }]}
                    onPress={() => setPreviewItemId(item.id)}
                  >
                    <Image
                      source={{ uri: item.imageUris[0] }}
                      style={styles.itemImage}
                    />
                  </Pressable>
                ))}
              </ScrollView>
            ) : (
              <View style={styles.row}>
                {group.entries.map((item) => (
                  <Pressable
                    key={item.id}
                    style={styles.itemCard}
                    onPress={() => setPreviewItemId(item.id)}
                  >
                    <Image
                      source={{ uri: item.imageUris[0] }}
                      style={styles.itemImage}
                    />
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        ))
      )}
      <ZoomableImageModal
        uri={previewItem?.imageUris[0] ?? null}
        onClose={() => setPreviewItemId(null)}
        onReplace={(croppedUri) =>
          previewItem
            ? onReplaceImage(previewItem.id, croppedUri)
            : Promise.resolve()
        }
      />
    </ScrollView>
  );
}
