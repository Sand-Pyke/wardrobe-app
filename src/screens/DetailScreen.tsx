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

  function tap(entry: ClothingItem | Outfit) {
    if (selecting)
      setSelected((prev) =>
        prev.includes(entry.id)
          ? prev.filter((x) => x !== entry.id)
          : [...prev, entry.id],
      );
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
      ) : isClothing ? (
        <ScrollView contentContainerStyle={styles.grid}>
          <Sortable.Grid<ClothingItem | { id: string; isAddTile: true }>
            columns={3}
            data={
              selecting
                ? (entries as ClothingItem[])
                : clothingGridEntries
            }
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
                  (entry): entry is ClothingItem => !("isAddTile" in entry),
                ),
              )
            }
            renderItem={({ item }) =>
              "isAddTile" in item ? (
                <DetailAddTile
                  onPress={() => setShowImageSourcePicker(true)}
                />
              ) : (
                <Pressable
                  onPress={() => tap(item)}
                  style={[
                    styles.sortableGridCard,
                    selected.includes(item.id) && styles.selectedCard,
                  ]}
                >
                  <Image
                    source={{ uri: item.imageUris[0] }}
                    style={styles.gridImage}
                  />
                  {selecting && selected.includes(item.id) && (
                    <View style={styles.check}>
                      <Ionicons name="checkmark-circle" size={22} color="#fff" />
                    </View>
                  )}
                </Pressable>
              )
            }
          />
        </ScrollView>
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
                {selected.includes(item.id) && (
                  <View style={styles.check}>
                    <Ionicons name="checkmark-circle" size={22} color="#fff" />
                  </View>
                )}
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

function DetailAddTile({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      style={styles.detailAddTile}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="添加图片"
    >
      <Ionicons name="add" size={30} color="#aa796d" />
    </Pressable>
  );
}
