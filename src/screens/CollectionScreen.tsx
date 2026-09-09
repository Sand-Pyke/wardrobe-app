import { Ionicons } from "@expo/vector-icons";
import { Pressable, ScrollView, Text, View } from "react-native";
import { DEFAULT_OUTFIT_CATEGORIES } from "../constants";
import { Outfit } from "../types";
import { Empty } from "../components/Empty";
import { OutfitThumb } from "../components/OutfitThumb";
import { styles } from "../styles";

export function Collection({
  outfits,
  customCategories,
  onOpenCategory,
  onOpenOutfit,
  onStyle,
}: {
  outfits: Outfit[];
  customCategories: string[];
  onOpenCategory: (c: string) => void;
  onOpenOutfit: (o: Outfit) => void;
  onStyle: () => void;
}) {
  const categories = [...DEFAULT_OUTFIT_CATEGORIES, ...customCategories];
  const groups = categories
    .map((category) => ({
      category,
      entries: outfits
        .filter((outfit) => outfit.category === category)
        .slice(0, 4),
    }))
    .filter((group) => group.entries.length);
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.topline}>
        <View>
          <Text style={styles.eyebrow}>LOOKBOOK</Text>
          <Text style={styles.title}>穿搭收藏</Text>
        </View>
        <Pressable
          accessibilityLabel="新增穿搭"
          style={styles.roundAdd}
          onPress={onStyle}
        >
          <Ionicons name="add" size={27} color="#fff" />
        </Pressable>
      </View>
      {groups.length === 0 ? (
        <Empty
          icon="heart-outline"
          title="当前的衣柜空空如也"
          body="快去搭配你的穿搭吧 👗"
          action="开始搭配"
          onPress={onStyle}
        />
      ) : (
        groups.map((group) => (
          <View key={group.category} style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>{group.category}</Text>
              {group.entries.length === 4 && (
                <Pressable onPress={() => onOpenCategory(group.category)}>
                  <Text style={styles.more}>更多 ›</Text>
                </Pressable>
              )}
            </View>
            <View style={styles.row}>
              {group.entries.slice(0, 3).map((outfit) => (
                <Pressable
                  key={outfit.id}
                  style={styles.outfitCard}
                  onPress={() => onOpenOutfit(outfit)}
                >
                  <OutfitThumb outfit={outfit} />
                  <Text style={styles.itemLabel}>{group.category}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

