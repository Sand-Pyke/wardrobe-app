import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, View } from "react-native";
import { DEFAULT_OUTFIT_CATEGORIES } from "../constants";
import { Outfit } from "../types";
import { Empty } from "../components/Empty";
import { OutfitThumb } from "../components/OutfitThumb";
import { styles } from "../styles";
import { OutfitPreviewModal } from "../components/OutfitPreviewModal";

export function Collection({
  outfits,
  customCategories,
  onOpenCategory,
  onOpenOutfit,
  onStyle,
  onDeleteOutfits,
}: {
  outfits: Outfit[];
  customCategories: string[];
  onOpenCategory: (c: string) => void;
  onOpenOutfit: (o: Outfit) => void;
  onStyle: () => void;
  onDeleteOutfits: (ids: string[]) => Promise<void>;
}) {
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [previewOutfit, setPreviewOutfit] = useState<Outfit | null>(null);
  const categories = [...DEFAULT_OUTFIT_CATEGORIES, ...customCategories];
  const groups = categories
    .map((category) => ({
      category,
      entries: outfits.filter((outfit) => outfit.category === category),
    }))
    .filter((group) => group.entries.length);
  const visibleIds = groups.flatMap((group) =>
    (selecting ? group.entries : group.entries.slice(0, 3)).map(
      (outfit) => outfit.id,
    ),
  );
  const allSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selected.includes(id));

  function tap(outfit: Outfit) {
    if (selecting) {
      setSelected((previous) =>
        previous.includes(outfit.id)
          ? previous.filter((id) => id !== outfit.id)
          : [...previous, outfit.id],
      );
    } else {
      setPreviewOutfit(outfit);
    }
  }

  function requestRemove() {
    if (!selected.length) {
      Alert.alert("还没有选择", "请先选择要删除的穿搭。");
      return;
    }
    Alert.alert(
      "删除穿搭？",
      `确定删除已选择的 ${selected.length} 套穿搭吗？此操作无法撤销。`,
      [
        { text: "取消", style: "cancel" },
        {
          text: "删除",
          style: "destructive",
          onPress: () => {
            void (async () => {
              await onDeleteOutfits(selected);
              setSelected([]);
              setSelecting(false);
              Alert.alert("删除成功");
            })();
          },
        },
      ],
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.topline}>
        <View>
          <Text style={styles.eyebrow}>LOOKBOOK</Text>
          <Text style={styles.title}>穿搭收藏</Text>
        </View>
        <Pressable
          accessibilityLabel={selecting ? "退出管理" : "管理穿搭"}
          style={styles.roundAdd}
          onPress={() => {
            setSelecting((value) => !value);
            setSelected([]);
          }}
        >
          <Ionicons
            name={selecting ? "close" : "ellipsis-horizontal"}
            size={27}
            color="#fff"
          />
        </Pressable>
      </View>
      {selecting && groups.length > 0 && (
        <View style={styles.selectionBar}>
          <Text>
            {selected.length
              ? `已选择 ${selected.length} 项`
              : "选择要删除的穿搭"}
          </Text>
          <View style={styles.selectionActions}>
            <Pressable
              onPress={() => setSelected(allSelected ? [] : visibleIds)}
            >
              <Text style={styles.selectAllText}>
                {allSelected ? "取消全选" : "全选"}
              </Text>
            </Pressable>
            <Pressable onPress={requestRemove}>
              <Text style={styles.deleteText}>删除</Text>
            </Pressable>
          </View>
        </View>
      )}
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
              {!selecting && group.entries.length > 3 && (
                <Pressable onPress={() => onOpenCategory(group.category)}>
                  <Text style={styles.more}>更多 ›</Text>
                </Pressable>
              )}
            </View>
            <View
              style={[styles.row, selecting && styles.collectionSelectionGrid]}
            >
              {(selecting ? group.entries : group.entries.slice(0, 3)).map((outfit) => (
                <Pressable
                  key={outfit.id}
                  style={[
                    styles.outfitCard,
                    selected.includes(outfit.id) && styles.selectedCard,
                  ]}
                  onPress={() => tap(outfit)}
                  onLongPress={() => {
                    if (!selecting) onOpenOutfit(outfit);
                  }}
                  delayLongPress={350}
                >
                  <OutfitThumb outfit={outfit} />
                  <Text style={styles.itemLabel}>{group.category}</Text>
                  {selecting && (
                    <View style={styles.check}>
                      <Ionicons
                        name={
                          selected.includes(outfit.id)
                            ? "checkmark-circle"
                            : "ellipse-outline"
                        }
                        size={22}
                        color="#fff"
                      />
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          </View>
        ))
      )}
      <OutfitPreviewModal
        outfit={previewOutfit}
        onClose={() => setPreviewOutfit(null)}
      />
    </ScrollView>
  );
}
