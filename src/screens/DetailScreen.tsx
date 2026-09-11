import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Alert, Image, Pressable, ScrollView, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { runOnJS, useSharedValue } from "react-native-reanimated";
import Sortable from "react-native-sortables";
import { ClothingCategory, CLOTHING_CATEGORIES } from "../constants";
import { ClothingItem, Outfit } from "../types";
import { Empty } from "../components/Empty";
import { OutfitThumb } from "../components/OutfitThumb";
import { styles } from "../styles";
import { DetailRoute } from "../navigation/types";
import { OutfitPreviewModal } from "../components/OutfitPreviewModal";
import { ZoomableImageModal } from "../components/ZoomableImageModal";
import { ImageSourcePicker } from "../components/ImageSourcePicker";

const nameOf = (value: ClothingCategory) =>
  CLOTHING_CATEGORIES.find((entry) => entry.value === value)?.label ?? value;

export function DetailScreen({
  detail,
  items,
  outfits,
  onBack,
  onAddImages,
  onReplaceImage,
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
  onAddImages: (category: ClothingCategory, uris: string[]) => Promise<void>;
  onReplaceImage: (itemId: string, imageUri: string) => Promise<void>;
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
  const [previewItemId, setPreviewItemId] = useState<string | null>(null);
  const [previewOutfit, setPreviewOutfit] = useState<Outfit | null>(null);
  const [showImageSourcePicker, setShowImageSourcePicker] = useState(false);
  const selectionGridWidth = useSharedValue(0);
  const visitedSwipeIndexes = useSharedValue<number[]>([]);
  const allSelected =
    entries.length > 0 && selected.length === entries.length;
  const clothingGridEntries = isClothing
    ? [
        ...(entries as ClothingItem[]),
        { id: "add-image", isAddTile: true as const },
      ]
    : [];
  const previewItem =
    items.find((item) => item.id === previewItemId) ?? null;

  const toggleSelection = React.useCallback((id: string) => {
    setSelected((previous) =>
      previous.includes(id)
        ? previous.filter((selectedId) => selectedId !== id)
        : [...previous, id],
    );
  }, []);
  const selectableIdKey = entries.map((entry) => entry.id).join("\u0000");
  const swipeSelectGesture = React.useMemo(() => {
    const selectableIds = selectableIdKey
      ? selectableIdKey.split("\u0000")
      : [];

    return Gesture.Pan()
      .enabled(selecting)
      .minDistance(4)
      .onBegin(() => {
        visitedSwipeIndexes.value = [];
      })
      .onStart((event) => {
        const cellSize = (selectionGridWidth.value - 20) / 3;
        if (cellSize <= 0) return;
        const cellStep = cellSize + 10;
        const column = Math.floor(event.x / cellStep);
        const row = Math.floor(event.y / cellStep);
        const insideColumn = event.x - column * cellStep <= cellSize;
        const insideRow = event.y - row * cellStep <= cellSize;
        const index = row * 3 + column;
        if (
          !insideColumn ||
          !insideRow ||
          column < 0 ||
          column > 2 ||
          row < 0 ||
          index < 0 ||
          index >= selectableIds.length
        )
          return;
        visitedSwipeIndexes.value = [index];
        runOnJS(toggleSelection)(selectableIds[index]);
      })
      .onUpdate((event) => {
        const cellSize = (selectionGridWidth.value - 20) / 3;
        if (cellSize <= 0) return;
        const cellStep = cellSize + 10;
        const column = Math.floor(event.x / cellStep);
        const row = Math.floor(event.y / cellStep);
        const insideColumn = event.x - column * cellStep <= cellSize;
        const insideRow = event.y - row * cellStep <= cellSize;
        const index = row * 3 + column;
        if (
          !insideColumn ||
          !insideRow ||
          column < 0 ||
          column > 2 ||
          row < 0 ||
          index < 0 ||
          index >= selectableIds.length ||
          visitedSwipeIndexes.value.includes(index)
        )
          return;
        visitedSwipeIndexes.value = [...visitedSwipeIndexes.value, index];
        runOnJS(toggleSelection)(selectableIds[index]);
      });
  }, [
    selectableIdKey,
    selecting,
    selectionGridWidth,
    toggleSelection,
    visitedSwipeIndexes,
  ]);

  function tap(entry: ClothingItem | Outfit) {
    if (selecting) toggleSelection(entry.id);
    else if (isClothing) setPreviewItemId(entry.id);
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
        <View style={styles.detailHeaderActions}>
          <Pressable onPress={onBack} hitSlop={10}>
            <Ionicons name="arrow-back" size={25} color="#292423" />
          </Pressable>
          <Pressable
            style={[
              styles.selectionHeaderButton,
              !selecting && styles.hiddenHeaderButton,
            ]}
            disabled={!selecting}
            onPress={() =>
              setSelected(allSelected ? [] : entries.map((item) => item.id))
            }
            accessibilityRole="button"
            accessibilityLabel={allSelected ? "取消全选" : "全选"}
          >
            <Ionicons
              name={allSelected ? "checkmark-done" : "checkmark-done-outline"}
              size={20}
              color="#9e5848"
            />
          </Pressable>
        </View>
        <View style={styles.detailHeaderTitle}>
          <Text style={styles.eyebrow}>
            {isClothing ? "CLOTHING CATEGORY" : "OUTFIT COLLECTION"}
          </Text>
          <Text style={styles.detailTitle}>{title}</Text>
        </View>
        <View style={[styles.detailHeaderActions, styles.detailHeaderActionsRight]}>
          <Pressable
            style={[
              styles.selectionHeaderButton,
              styles.deleteHeaderButton,
              !selecting && styles.hiddenHeaderButton,
            ]}
            disabled={!selecting}
            onPress={requestRemove}
            accessibilityRole="button"
            accessibilityLabel="删除所选项目"
          >
            <Ionicons name="trash-outline" size={19} color="#b13e31" />
          </Pressable>
        <Pressable
          style={styles.selectionHeaderButton}
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
      </View>
      {entries.length === 0 && !isClothing ? (
        <Empty
          icon="images-outline"
          title="这里还没有内容"
          body="这个分类还没有穿搭"
          action="返回"
          onPress={onBack}
        />
      ) : !isClothing && entries.length === 1 ? (
        <ScrollView contentContainerStyle={styles.grid}>
          <GestureDetector gesture={swipeSelectGesture}>
            <View
              style={styles.selectionGrid}
              onLayout={(event) => {
                selectionGridWidth.value = event.nativeEvent.layout.width;
              }}
            >
              <Pressable
                onPress={() => tap(entries[0])}
                onLongPress={() =>
                  !selecting && onOpenOutfit(entries[0] as Outfit)
                }
                style={[
                  styles.gridCard,
                  selecting &&
                    selected.includes(entries[0].id) &&
                    styles.selectedCard,
                ]}
              >
                <OutfitThumb outfit={entries[0] as Outfit} />
                {selecting && selected.includes(entries[0].id) && (
                  <View style={styles.check}>
                    <Ionicons
                      name="checkmark-circle"
                      size={22}
                      color="#fff"
                    />
                  </View>
                )}
              </Pressable>
            </View>
          </GestureDetector>
        </ScrollView>
      ) : (
        <ScrollView contentContainerStyle={styles.grid}>
          <GestureDetector gesture={swipeSelectGesture}>
            <View
              onLayout={(event) => {
                selectionGridWidth.value = event.nativeEvent.layout.width;
              }}
            >
              <Sortable.Grid<
                ClothingItem | Outfit | { id: string; isAddTile: true }
              >
                columns={3}
                data={isClothing ? clothingGridEntries : entries}
                keyExtractor={(entry) => entry.id}
                strategy="insert"
                sortEnabled={!selecting}
                rowGap={10}
                columnGap={10}
                dragActivationDelay={320}
                activationAnimationDuration={160}
                dropAnimationDuration={220}
                activeItemScale={1.09}
                activeItemShadowOpacity={0.28}
                inactiveItemScale={0.98}
                itemsLayoutTransitionMode="all"
                onDragEnd={({ data }) =>
                  persistOrder(
                    data.filter(
                      (entry): entry is ClothingItem | Outfit =>
                        !("isAddTile" in entry),
                    ),
                  )
                }
                renderItem={({ item }) =>
                  "isAddTile" in item ? (
                    <DetailAddTile
                      hidden={selecting}
                      onPress={() => setShowImageSourcePicker(true)}
                    />
                  ) : (
                    <Pressable
                      onPress={() => tap(item)}
                      onLongPress={() =>
                        !selecting &&
                        !isClothing &&
                        onOpenOutfit(item as Outfit)
                      }
                      style={[
                        styles.sortableGridCard,
                        selecting &&
                          selected.includes(item.id) &&
                          styles.selectedCard,
                      ]}
                    >
                      {isClothing ? (
                        <Image
                          source={{
                            uri: (item as ClothingItem).imageUris[0],
                          }}
                          style={styles.gridImage}
                        />
                      ) : (
                        <OutfitThumb outfit={item as Outfit} />
                      )}
                      {selecting && selected.includes(item.id) && (
                        <View style={styles.check}>
                          <Ionicons
                            name="checkmark-circle"
                            size={22}
                            color="#fff"
                          />
                        </View>
                      )}
                    </Pressable>
                  )
                }
              />
            </View>
          </GestureDetector>
        </ScrollView>
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
      <OutfitPreviewModal
        outfit={previewOutfit}
        onClose={() => setPreviewOutfit(null)}
      />
      <ImageSourcePicker
        visible={showImageSourcePicker}
        onClose={() => setShowImageSourcePicker(false)}
        onPick={(uris) =>
          onAddImages(detail.category as ClothingCategory, uris)
        }
      />
    </View>
  );
}

function DetailAddTile({
  onPress,
  hidden = false,
}: {
  onPress: () => void;
  hidden?: boolean;
}) {
  return (
    <Pressable
      style={[styles.detailAddTile, hidden && styles.hiddenGridTile]}
      onPress={onPress}
      disabled={hidden}
      accessibilityRole="button"
      accessibilityLabel="添加图片"
    >
      <Ionicons name="add" size={30} color="#aa796d" />
    </Pressable>
  );
}
