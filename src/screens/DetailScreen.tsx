import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { Alert, Image, Modal, Pressable, ScrollView, Text, View } from "react-native";
import Sortable from "react-native-sortables";
import { ClothingCategory, CLOTHING_CATEGORIES } from "../constants";
import { ClothingItem, Outfit } from "../types";
import { Empty } from "../components/Empty";
import { OutfitThumb } from "../components/OutfitThumb";
import { styles } from "../styles";
import { DetailRoute } from "../navigation/types";

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

  function tap(entry: ClothingItem | Outfit) {
    if (selecting)
      setSelected((prev) =>
        prev.includes(entry.id)
          ? prev.filter((x) => x !== entry.id)
          : [...prev, entry.id],
      );
    else if (isClothing) setPreviewUri((entry as ClothingItem).imageUris[0]);
    else onOpenOutfit(entry as Outfit);
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
  async function remove() {
    if (!selected.length) return;
    isClothing
      ? await onDeleteItems(selected)
      : await onDeleteOutfits(selected);
    setSelected([]);
    setSelecting(false);
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
          <Pressable onPress={() => void remove()}>
            <Text style={styles.deleteText}>删除</Text>
          </Pressable>
        </View>
      )}
      {entries.length === 0 ? (
        <Empty
          icon="images-outline"
          title="这里还没有内容"
          body="从下方加号开始添加吧"
          action="添加"
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
      <Pressable
        style={styles.floatingAdd}
        onPress={() => (isClothing ? onAdd(detail.category) : onBack())}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </Pressable>
      <Modal visible={Boolean(previewUri)} transparent animationType="fade">
        <View style={styles.previewModal}>
          <Pressable
            style={styles.previewClose}
            onPress={() => setPreviewUri(null)}
            accessibilityLabel="关闭图片预览"
          >
            <Ionicons name="close" size={28} color="#fff" />
          </Pressable>
          {previewUri && (
            <Image
              source={{ uri: previewUri }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </View>
  );
}

