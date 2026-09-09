import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Alert, Image, Pressable, ScrollView, Text, View } from "react-native";
import Sortable from "react-native-sortables";
import { ClothingCategory, CLOTHING_CATEGORIES } from "../constants";
import { ClothingItem, Outfit } from "../types";
import { Empty } from "../components/Empty";
import { OutfitThumb } from "../components/OutfitThumb";
import { styles } from "../styles";
import { DetailRoute } from "../navigation/types";
import { OutfitPreviewModal } from "../components/OutfitPreviewModal";
import { ZoomableImageModal } from "../components/ZoomableImageModal";

const nameOf = (value: ClothingCategory) =>
  CLOTHING_CATEGORIES.find((entry) => entry.value === value)?.label ?? value;

export function DetailScreen({
  detail,
  items,
  outfits,
  onBack,
  onAdd,
  onDeleteItems,
  onDeleteOutfits,
  onOpenOutfit,
  onReorderItems,
  onReorderOutfits,
}: {
  detail: NonNullable<DetailRoute>;
  items: ClothingItem[];
  outfits: Outfit[];
  onBack: () => void;
  onAdd: (c?: ClothingCategory) => void;
  onDeleteItems: (ids: string[]) => Promise<void>;
  onDeleteOutfits: (ids: string[]) => Promise<void>;
  onOpenOutfit: (o: Outfit) => void;
  onReorderItems: (x: ClothingItem[]) => Promise<void>;
  onReorderOutfits: (x: Outfit[]) => Promise<void>;
}) {
  const isClothing = detail.type === "clothing";
  const entries: Array<ClothingItem | Outfit> = (
    isClothing
      ? items.filter((item) => item.category === detail.category)
      : outfits.filter((outfit) => outfit.category === detail.category)
  ).sort((a, b) => a.sortOrder - b.sortOrder);
  const [selecting, setSelecting] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewOutfit, setPreviewOutfit] = useState<Outfit | null>(null);
  const allSelected =
    entries.length > 0 && selected.length === entries.length;

  function tap(entry: ClothingItem | Outfit) {
    if (selecting)
      setSelected((prev) =>
        prev.includes(entry.id)
          ? prev.filter((x) => x !== entry.id)
          : [...prev, entry.id],
      );
    else if (isClothing) setPreviewUri((entry as ClothingItem).imageUris[0]);
    else setPreviewOutfit(entry as Outfit);
  }
  function persistOrder(orderedEntries: Array<ClothingItem | Outfit>) {
    const ordered = orderedEntries.map((entry, index) => ({
      ...entry,
      sortOrder: index,
    }));
    if (isClothing) {
      void onReorderItems(
        items.map(
          (item) => ordered.find((entry) => entry.id === item.id) ?? item,
        ) as ClothingItem[],
      );
    } else {
      void onReorderOutfits(
        outfits.map(
          (outfit) =>
            ordered.find((entry) => entry.id === outfit.id) ?? outfit,
        ) as Outfit[],
      );
    }
  }
  function requestRemove() {
    if (!selected.length) {
      Alert.alert("还没有选择", "请先选择要删除的项目。");
      return;
    }
    Alert.alert(
      isClothing ? "删除衣物图片？" : "删除穿搭？",
      `确定删除已选择的 ${selected.length} 项吗？此操作无法撤销。`,
      [
        { text: "取消", style: "cancel" },
        {
          text: "删除",
          style: "destructive",
          onPress: () => {
            void (async () => {
              if (isClothing) await onDeleteItems(selected);
              else await onDeleteOutfits(selected);
              setSelected([]);
              setSelecting(false);
              Alert.alert("删除成功");
            })();
          },
        },
      ],
    );
  }
  const title = isClothing ? nameOf(detail.category) : detail.category;
  return (
    <View style={styles.page}>
      <View style={styles.detailHeader}>
        <Pressable onPress={onBack} hitSlop={10}>
          <Ionicons name="arrow-back" size={25} color="#292423" />
        </Pressable>
        <View>
          <Text style={styles.eyebrow}>
            {isClothing ? "CLOTHING CATEGORY" : "OUTFIT COLLECTION"}
          </Text>
          <Text style={styles.detailTitle}>{title}</Text>
        </View>
        <Pressable
          onPress={() => {
            if (selecting) {
              setSelecting(false);
              setSelected([]);
            } else setSelecting(true);
          }}
        >
          <Ionicons
            name={selecting ? "close" : "ellipsis-horizontal"}
            size={25}
            color="#292423"
          />
        </Pressable>
      </View>
      {selecting && (
        <View style={styles.selectionBar}>
          <Text>
            {selected.length
              ? `已选择 ${selected.length} 项`
              : "选择要删除的项目"}
          </Text>
          <View style={styles.selectionActions}>
            <Pressable
              onPress={() =>
                setSelected(allSelected ? [] : entries.map((item) => item.id))
              }
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
      {entries.length === 0 ? (
        <Empty
          icon="images-outline"
          title="这里还没有内容"
          body={isClothing ? "从下方加号开始添加吧" : "这个分类还没有穿搭"}
          action={isClothing ? "添加" : "返回"}
          onPress={() => (isClothing ? onAdd(detail.category) : onBack())}
        />
      ) : selecting ? (
        <ScrollView contentContainerStyle={styles.grid}>
          <View style={styles.selectionGrid}>
            {entries.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => tap(item)}
                style={[
                  styles.gridCard,
                  selected.includes(item.id) && styles.selectedCard,
                ]}
              >
                {isClothing ? (
                  <Image
                    source={{ uri: (item as ClothingItem).imageUris[0] }}
                    style={styles.gridImage}
                  />
                ) : (
                  <OutfitThumb outfit={item as Outfit} />
                )}
                <View style={styles.check}>
                  <Ionicons
                    name={
                      selected.includes(item.id)
                        ? "checkmark-circle"
                        : "ellipse-outline"
                    }
                    size={22}
                    color="#fff"
                  />
                </View>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      ) : entries.length === 1 ? (
        <ScrollView contentContainerStyle={styles.grid}>
          <View style={styles.selectionGrid}>
            <Pressable
              onPress={() => tap(entries[0])}
              onLongPress={() =>
                !isClothing && onOpenOutfit(entries[0] as Outfit)
              }
              style={styles.gridCard}
            >
              {isClothing ? (
                <Image
                  source={{ uri: (entries[0] as ClothingItem).imageUris[0] }}
                  style={styles.gridImage}
                />
              ) : (
                <OutfitThumb outfit={entries[0] as Outfit} />
              )}
            </Pressable>
          </View>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.grid}>
          <Sortable.Grid<ClothingItem | Outfit>
            columns={3}
            data={entries}
            keyExtractor={(entry) => entry.id}
            strategy="insert"
            rowGap={10}
            columnGap={10}
            dragActivationDelay={320}
            activationAnimationDuration={160}
            dropAnimationDuration={220}
            activeItemScale={1.09}
            activeItemShadowOpacity={0.28}
            inactiveItemScale={0.98}
            itemsLayoutTransitionMode="all"
            onDragEnd={({ data }) => persistOrder(data)}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => tap(item)}
                style={styles.sortableGridCard}
              >
                {isClothing ? (
                  <Image
                    source={{ uri: (item as ClothingItem).imageUris[0] }}
                    style={styles.gridImage}
                  />
                ) : (
                  <OutfitThumb outfit={item as Outfit} />
                )}
              </Pressable>
            )}
          />
        </ScrollView>
      )}
      {isClothing && (
        <Pressable
          style={styles.floatingAdd}
          onPress={() => onAdd(detail.category)}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </Pressable>
      )}
      <ZoomableImageModal
        uri={previewUri}
        onClose={() => setPreviewUri(null)}
      />
      <OutfitPreviewModal
        outfit={previewOutfit}
        onClose={() => setPreviewOutfit(null)}
      />
    </View>
  );
}
