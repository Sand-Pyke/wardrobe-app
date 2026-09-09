import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  SafeAreaProvider,
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import Sortable from "react-native-sortables";
import {
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  CLOTHING_CATEGORIES,
  ClothingCategory,
  DEFAULT_OUTFIT_CATEGORIES,
  OutfitPart,
  PART_ALLOWED,
  PART_LABELS,
} from "./src/constants";
import { repository } from "./src/data/storage";
import { ClothingItem, Outfit } from "./src/types";

type Tab = "home" | "style" | "collection";
type Detail =
  | { type: "clothing"; category: ClothingCategory }
  | { type: "outfit"; category: string }
  | null;
const id = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const nameOf = (value: ClothingCategory) =>
  CLOTHING_CATEGORIES.find((x) => x.value === value)?.label ?? value;

export default function App() {
  const [tab, setTab] = useState<Tab>("home");
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [outfits, setOutfits] = useState<Outfit[]>([]);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [detail, setDetail] = useState<Detail>(null);
  const [addCategory, setAddCategory] = useState<ClothingCategory | null>(null);
  const [editingOutfit, setEditingOutfit] = useState<Outfit | null>(null);

  useEffect(() => {
    void load();
  }, []);
  async function load() {
    const [loadedItems, loadedOutfits, loadedCategories] = await Promise.all([
      repository.getItems(),
      repository.getOutfits(),
      repository.getOutfitCategories(),
    ]);
    setItems(loadedItems);
    setOutfits(loadedOutfits);
    setCustomCategories(loadedCategories);
  }
  async function persistItems(next: ClothingItem[]) {
    setItems(next);
    await repository.saveItems(next);
  }
  async function persistOutfits(next: Outfit[]) {
    setOutfits(next);
    await repository.saveOutfits(next);
  }

  function openAdd(category?: ClothingCategory) {
    setAddCategory(category ?? "top");
  }
  async function addItems(category: ClothingCategory, imageUris: string[]) {
    const existing = items.filter((x) => x.category === category).length;
    const additions = imageUris.map(
      (uri, index): ClothingItem => ({
        id: id(),
        category,
        imageUris: [uri],
        createdAt: new Date().toISOString(),
        sortOrder: existing + index,
      }),
    );
    await persistItems([...items, ...additions]);
  }
  async function deleteItems(ids: string[]) {
    await persistItems(items.filter((item) => !ids.includes(item.id)));
  }
  async function deleteOutfits(ids: string[]) {
    await persistOutfits(outfits.filter((outfit) => !ids.includes(outfit.id)));
  }
  async function saveOutfit(outfit: Outfit, isNewCategory: boolean) {
    const next = outfits.some((x) => x.id === outfit.id)
      ? outfits.map((x) => (x.id === outfit.id ? outfit : x))
      : [outfit, ...outfits];
    await persistOutfits(next);
    if (
      isNewCategory &&
      !DEFAULT_OUTFIT_CATEGORIES.includes(outfit.category as never) &&
      !customCategories.includes(outfit.category)
    ) {
      const categories = [...customCategories, outfit.category];
      setCustomCategories(categories);
      await repository.saveOutfitCategories(categories);
    }
    setEditingOutfit(null);
    setTab("collection");
  }

  if (detail) {
    return (
      <GestureHandlerRootView style={styles.gestureRoot}>
        <SafeAreaProvider>
          <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
            <StatusBar style="dark" />
            <DetailScreen
              detail={detail}
              items={items}
              outfits={outfits}
              onBack={() => setDetail(null)}
              onAdd={openAdd}
              onDeleteItems={deleteItems}
              onDeleteOutfits={deleteOutfits}
              onOpenOutfit={(outfit) => {
                setDetail(null);
                setEditingOutfit(outfit);
                setTab("style");
              }}
              onReorderItems={persistItems}
              onReorderOutfits={persistOutfits}
            />
            <AddClothingModal
              visible={addCategory !== null}
              initialCategory={addCategory ?? "top"}
              onClose={() => setAddCategory(null)}
              onSave={async (c, u) => {
                await addItems(c, u);
                setAddCategory(null);
              }}
            />
          </SafeAreaView>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <SafeAreaProvider>
        <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
          <StatusBar style="dark" />
          <View style={styles.page}>
        {tab === "home" && (
          <Home
            items={items}
            onAdd={openAdd}
            onOpenCategory={(category) =>
              setDetail({ type: "clothing", category })
            }
          />
        )}
        {tab === "style" && (
          <Styling
            items={items}
            editing={editingOutfit}
            onCancelEdit={() => setEditingOutfit(null)}
            onSave={saveOutfit}
          />
        )}
        {tab === "collection" && (
          <Collection
            outfits={outfits}
            customCategories={customCategories}
            onOpenCategory={(category) =>
              setDetail({ type: "outfit", category })
            }
            onOpenOutfit={(outfit) => {
              setEditingOutfit(outfit);
              setTab("style");
            }}
            onStyle={() => setTab("style")}
          />
        )}
          </View>
          <BottomTabs
            active={tab}
            onChange={(next) => {
              setEditingOutfit(null);
              setTab(next);
            }}
          />
          <AddClothingModal
            visible={addCategory !== null}
            initialCategory={addCategory ?? "top"}
            onClose={() => setAddCategory(null)}
            onSave={async (c, u) => {
              await addItems(c, u);
              setAddCategory(null);
            }}
          />
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function Home({
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

function Styling({
  items,
  editing,
  onCancelEdit,
  onSave,
}: {
  items: ClothingItem[];
  editing: Outfit | null;
  onCancelEdit: () => void;
  onSave: (outfit: Outfit, isNew: boolean) => Promise<void>;
}) {
  const [parts, setParts] = useState<Partial<Record<OutfitPart, ClothingItem>>>(
    editing?.parts ?? {},
  );
  const [category, setCategory] = useState(editing?.category ?? "春夏");
  const [custom, setCustom] = useState("");
  const [chooser, setChooser] = useState<OutfitPart | null>(null);
  useEffect(() => {
    setParts(editing?.parts ?? {});
    setCategory(editing?.category ?? "春夏");
    setCustom("");
  }, [editing]);
  const isDress = parts.torso?.category === "dress";
  function choose(item: ClothingItem) {
    if (chooser)
      setParts((prev) => ({
        ...prev,
        [chooser]: item,
        ...(chooser === "torso" && item.category === "dress"
          ? { legs: undefined }
          : {}),
      }));
    setChooser(null);
  }
  const valid = Boolean(parts.torso && (isDress || parts.legs));
  const selectedCategory = custom.trim() || category;
  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.topline}>
        <View>
          <Text style={styles.eyebrow}>
            {editing ? "EDIT OUTFIT" : "CREATE AN OUTFIT"}
          </Text>
          <Text style={styles.title}>{editing ? "编辑穿搭" : "今日搭配"}</Text>
        </View>
        {editing && (
          <Pressable onPress={onCancelEdit}>
            <Text style={styles.cancelText}>取消</Text>
          </Pressable>
        )}
      </View>
      <Text style={styles.helper}>点按假人部位，选择衣柜里的单品</Text>
      <Mannequin
        parts={parts}
        isDress={isDress}
        onPress={(part) => setChooser(part)}
      />
      <View style={styles.rule} />
      <Text style={styles.sectionTitle}>穿搭分类</Text>
      <Text style={styles.tip}>选择一个季节，或新建自己的标签</Text>
      <View style={styles.chips}>
        {DEFAULT_OUTFIT_CATEGORIES.map((item) => (
          <Chip
            key={item}
            selected={category === item && !custom}
            text={item}
            onPress={() => {
              setCategory(item);
              setCustom("");
            }}
          />
        ))}
      </View>
      <TextInput
        style={styles.input}
        placeholder="例如：通勤、约会、旅行"
        value={custom}
        onChangeText={setCustom}
        maxLength={16}
      />
      <Pressable
        style={[styles.primaryButton, !valid && styles.disabled]}
        onPress={() => {
          if (!valid)
            return Alert.alert(
              "还不能保存",
              "请选择躯干；上衣还需要搭配裤子或裙子。",
            );
          void onSave(
            {
              id: editing?.id ?? id(),
              category: selectedCategory,
              parts,
              createdAt: editing?.createdAt ?? new Date().toISOString(),
              sortOrder: editing?.sortOrder ?? 0,
            },
            Boolean(custom.trim()),
          );
        }}
      >
        <Text style={styles.primaryText}>
          {editing ? "保存修改" : "保存这套穿搭"}
        </Text>
        <Ionicons name="arrow-forward" color="#fff" size={19} />
      </Pressable>
      <ItemChooser
        visible={chooser !== null}
        part={chooser}
        items={items}
        onClose={() => setChooser(null)}
        onPick={choose}
      />
    </ScrollView>
  );
}

function Mannequin({
  parts,
  isDress,
  onPress,
}: {
  parts: Partial<Record<OutfitPart, ClothingItem>>;
  isDress: boolean;
  onPress: (part: OutfitPart) => void;
}) {
  const image = (part: OutfitPart) => parts[part]?.imageUris[0];
  return (
    <View style={styles.mannequinWrap}>
      <Pressable style={styles.manHead} onPress={() => onPress("head")}>
        {image("head") ? (
          <Image source={{ uri: image("head") }} style={styles.partImage} />
        ) : (
          <PartHint icon="add" text="帽子" />
        )}
      </Pressable>
      <Pressable style={styles.manNeck} onPress={() => onPress("neck")}>
        {image("neck") ? (
          <Image source={{ uri: image("neck") }} style={styles.partImage} />
        ) : (
          <PartHint icon="add" text="围巾" />
        )}
      </Pressable>
      <Pressable
        style={[styles.manTorso, isDress && styles.manDress]}
        onPress={() => onPress("torso")}
      >
        {image("torso") ? (
          <Image source={{ uri: image("torso") }} style={styles.partImage} />
        ) : (
          <PartHint icon="add" text="上衣 / 连衣裙" />
        )}
      </Pressable>
      {!isDress && (
        <Pressable style={styles.manLegs} onPress={() => onPress("legs")}>
          {image("legs") ? (
            <Image source={{ uri: image("legs") }} style={styles.partImage} />
          ) : (
            <PartHint icon="add" text="裤子 / 裙子" />
          )}
        </Pressable>
      )}
      <Pressable
        style={[styles.manFeet, isDress && styles.manFeetDress]}
        onPress={() => onPress("feet")}
      >
        {image("feet") ? (
          <Image source={{ uri: image("feet") }} style={styles.partImage} />
        ) : (
          <PartHint icon="add" text="袜子 / 鞋子" />
        )}
      </Pressable>
    </View>
  );
}
function PartHint({ icon, text }: { icon: "add"; text: string }) {
  return (
    <View style={styles.partHint}>
      <Ionicons name={icon} size={18} color="#aa796d" />
      <Text style={styles.partText}>{text}</Text>
    </View>
  );
}

function Collection({
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

function OutfitThumb({ outfit }: { outfit: Outfit }) {
  const image =
    outfit.parts.torso?.imageUris[0] ??
    outfit.parts.legs?.imageUris[0] ??
    outfit.parts.head?.imageUris[0];
  return (
    <View style={styles.outfitThumb}>
      {image ? (
        <Image source={{ uri: image }} style={styles.itemImage} />
      ) : (
        <Ionicons name="body-outline" size={38} color="#aa796d" />
      )}
    </View>
  );
}

function DetailScreen({
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
  detail: NonNullable<Detail>;
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

function AddClothingModal({
  visible,
  initialCategory,
  onClose,
  onSave,
}: {
  visible: boolean;
  initialCategory: ClothingCategory;
  onClose: () => void;
  onSave: (c: ClothingCategory, images: string[]) => Promise<void>;
}) {
  const [category, setCategory] = useState<ClothingCategory>(initialCategory);
  const [images, setImages] = useState<string[]>([]);
  useEffect(() => {
    if (visible) {
      setCategory(initialCategory);
      setImages([]);
    }
  }, [visible, initialCategory]);
  async function pick(source: "library" | "camera" | "files") {
    try {
      if (source === "files") {
        const result = await DocumentPicker.getDocumentAsync({
          type: "image/*",
          multiple: true,
          copyToCacheDirectory: true,
        });
        if (!result.canceled)
          setImages((prev) => [
            ...prev,
            ...result.assets.map((asset) => asset.uri),
          ]);
        return;
      }
      if (source === "camera") {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted)
          return Alert.alert("需要相机权限", "请在系统设置中允许相机权限。");
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          quality: 0.8,
        });
        if (!result.canceled)
          setImages((prev) => [...prev, result.assets[0].uri]);
        return;
      }
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted)
        return Alert.alert("需要相册权限", "请在系统设置中允许相册权限。");
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        selectionLimit: 10,
        quality: 0.8,
      });
      if (!result.canceled)
        setImages((prev) => [
          ...prev,
          ...result.assets.map((asset) => asset.uri),
        ]);
    } catch {
      Alert.alert("选择图片失败", "请稍后重试。");
    }
  }
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalShade}>
        <View style={styles.sheet}>
          <View style={styles.sheetGrip} />
          <View style={styles.sheetTitleRow}>
            <Text style={styles.sheetTitle}>添加衣物</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color="#292423" />
            </Pressable>
          </View>
          <Text style={styles.fieldLabel}>衣物分类</Text>
          <View style={styles.chips}>
            {CLOTHING_CATEGORIES.map((item) => (
              <Chip
                key={item.value}
                text={item.label}
                selected={category === item.value}
                onPress={() => setCategory(item.value)}
              />
            ))}
          </View>
          {(CLOTHING_CATEGORIES.find((x) => x.value === category) as { tip?: string } | undefined)?.tip && (
            <Text style={styles.tip}>
              {(CLOTHING_CATEGORIES.find((x) => x.value === category) as { tip?: string } | undefined)?.tip}
            </Text>
          )}
          <Text style={styles.fieldLabel}>
            衣物图片 <Text style={styles.required}>*</Text>
          </Text>
          <View style={styles.uploadRow}>
            {images.map((uri) => (
              <View key={uri} style={styles.previewWrap}>
                <Image source={{ uri }} style={styles.preview} />
                <Pressable
                  style={styles.removePreview}
                  onPress={() =>
                    setImages((prev) => prev.filter((x) => x !== uri))
                  }
                >
                  <Ionicons name="close" size={13} color="#fff" />
                </Pressable>
              </View>
            ))}
            <Pressable
              style={styles.uploadTile}
              onPress={() => pick("library")}
            >
              <Ionicons name="images-outline" size={23} color="#aa796d" />
              <Text style={styles.uploadText}>相册</Text>
            </Pressable>
          </View>
          <View style={styles.sourceRow}>
            <SourceButton
              icon="camera-outline"
              text="拍照"
              onPress={() => pick("camera")}
            />
            <SourceButton
              icon="folder-open-outline"
              text="文件"
              onPress={() => pick("files")}
            />
          </View>
          <View style={styles.modalActions}>
            <Pressable style={styles.secondaryButton} onPress={onClose}>
              <Text>取消</Text>
            </Pressable>
            <Pressable
              style={[styles.confirmButton, !images.length && styles.disabled]}
              onPress={() => {
                if (!images.length)
                  return Alert.alert("请先添加图片", "衣物图片是必填项。");
                void onSave(category, images);
              }}
            >
              <Text style={styles.primaryText}>确定添加</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
function ItemChooser({
  visible,
  part,
  items,
  onClose,
  onPick,
}: {
  visible: boolean;
  part: OutfitPart | null;
  items: ClothingItem[];
  onClose: () => void;
  onPick: (item: ClothingItem) => void;
}) {
  const allowed = part ? PART_ALLOWED[part] : [];
  const choices = items.filter((item) => allowed.includes(item.category));
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalShade}>
        <View style={styles.chooser}>
          <View style={styles.sheetTitleRow}>
            <View>
              <Text style={styles.sheetTitle}>
                选择{part ? PART_LABELS[part] : ""}
              </Text>
              <Text style={styles.tip}>从已有衣物中选择</Text>
            </View>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={24} color="#292423" />
            </Pressable>
          </View>
          {choices.length ? (
            <FlatList
              data={choices}
              numColumns={3}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.chooserGrid}
              renderItem={({ item }) => (
                <Pressable style={styles.choice} onPress={() => onPick(item)}>
                  <Image
                    source={{ uri: item.imageUris[0] }}
                    style={styles.choiceImage}
                  />
                  <Text style={styles.choiceText}>{nameOf(item.category)}</Text>
                </Pressable>
              )}
            />
          ) : (
            <Empty
              icon="shirt-outline"
              title="还没有可选衣物"
              body="请先到主页添加对应分类的图片"
              action="知道了"
              onPress={onClose}
            />
          )}
        </View>
      </View>
    </Modal>
  );
}
function BottomTabs({
  active,
  onChange,
}: {
  active: Tab;
  onChange: (tab: Tab) => void;
}) {
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
    <View style={styles.tabbar}>
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
function Empty({
  icon,
  title,
  body,
  action,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  body: string;
  action: string;
  onPress: () => void;
}) {
  return (
    <View style={styles.empty}>
      <View style={styles.emptyIcon}>
        <Ionicons name={icon} size={38} color="#b8604e" />
      </View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
      <Pressable style={styles.emptyAction} onPress={onPress}>
        <Ionicons name="add" size={18} color="#fff" />
        <Text style={styles.emptyActionText}>{action}</Text>
      </Pressable>
    </View>
  );
}
function Chip({
  text,
  selected,
  onPress,
}: {
  text: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.chipActive]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextActive]}>
        {text}
      </Text>
    </Pressable>
  );
}
function SourceButton({
  icon,
  text,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.sourceButton} onPress={onPress}>
      <Ionicons name={icon} size={18} color="#725b55" />
      <Text style={styles.sourceText}>{text}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  gestureRoot: { flex: 1 },
  safe: { flex: 1, backgroundColor: "#fffaf7" },
  page: { flex: 1 },
  scroll: { padding: 20, paddingBottom: 30 },
  topline: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  eyebrow: {
    color: "#aa796d",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.4,
  },
  title: { fontSize: 29, fontWeight: "800", color: "#292423", marginTop: 2 },
  roundAdd: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#b8604e",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#7a2e20",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 3,
  },
  section: { marginBottom: 26 },
  sectionHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: { fontSize: 18, color: "#302a29", fontWeight: "800" },
  tip: { fontSize: 12, color: "#967f78", marginTop: 3 },
  more: { fontSize: 13, color: "#b8604e", fontWeight: "700" },
  row: { flexDirection: "row", gap: 10 },
  itemCard: { width: "31.9%" },
  itemImage: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 15,
    backgroundColor: "#f1e5df",
  },
  itemLabel: { color: "#695e5a", fontSize: 12, marginTop: 6 },
  empty: {
    alignItems: "center",
    alignSelf: "stretch",
    paddingTop: 86,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: "#f7e9e4",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
  },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#332d2c" },
  emptyBody: {
    fontSize: 14,
    color: "#8e817c",
    marginTop: 7,
    textAlign: "center",
  },
  emptyAction: {
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
    backgroundColor: "#b8604e",
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 22,
    marginTop: 19,
  },
  emptyActionText: { color: "#fff", fontWeight: "700" },
  tabbar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#eee3df",
    paddingTop: 12,
    paddingBottom: Platform.OS === "ios" ? 20 : 14,
    shadowColor: "#5f4139",
    shadowOpacity: 0.05,
    shadowRadius: 9,
    shadowOffset: { width: 0, height: -3 },
    elevation: 5,
  },
  tab: { flex: 1, alignItems: "center", gap: 3 },
  tabText: { fontSize: 11, color: "#9b918e" },
  activeTabText: { color: "#b8604e", fontWeight: "700" },
  helper: { color: "#8e817c", fontSize: 13, marginTop: -14, marginBottom: 9 },
  mannequinWrap: {
    height: 437,
    alignItems: "center",
    position: "relative",
    paddingTop: 8,
  },
  manHead: {
    height: 67,
    width: 70,
    borderRadius: 35,
    backgroundColor: "#f0ece9",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  manNeck: {
    height: 36,
    width: 54,
    borderRadius: 10,
    backgroundColor: "#e9e2de",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginTop: -4,
    zIndex: 1,
  },
  manTorso: {
    width: 176,
    height: 145,
    backgroundColor: "#f2eeeb",
    borderRadius: 45,
    marginTop: -1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  manDress: {
    height: 228,
    borderBottomLeftRadius: 70,
    borderBottomRightRadius: 70,
  },
  manLegs: {
    width: 125,
    height: 112,
    backgroundColor: "#eee8e4",
    marginTop: 2,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
  },
  manFeet: {
    width: 158,
    height: 52,
    borderRadius: 18,
    backgroundColor: "#e9e2de",
    marginTop: 5,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  manFeetDress: { marginTop: 6 },
  partImage: { width: "100%", height: "100%", resizeMode: "cover" },
  partHint: { alignItems: "center" },
  partText: { fontSize: 10, color: "#936f66", marginTop: 1 },
  rule: { height: 1, backgroundColor: "#eee3df", marginBottom: 18 },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 13,
    paddingVertical: 8,
    borderRadius: 19,
    backgroundColor: "#f3ece8",
    borderWidth: 1,
    borderColor: "transparent",
  },
  chipActive: { backgroundColor: "#f9ded5", borderColor: "#c87563" },
  chipText: { color: "#756863", fontSize: 13 },
  chipTextActive: { color: "#9e4534", fontWeight: "700" },
  input: {
    borderWidth: 1,
    borderColor: "#e5d9d4",
    backgroundColor: "#fff",
    borderRadius: 13,
    paddingHorizontal: 14,
    height: 47,
    marginTop: 8,
    fontSize: 14,
    color: "#322b29",
  },
  primaryButton: {
    flexDirection: "row",
    height: 51,
    borderRadius: 15,
    backgroundColor: "#b8604e",
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  disabled: { opacity: 0.42 },
  primaryText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  cancelText: { color: "#b8604e", fontWeight: "700" },
  outfitCard: { width: "31.9%" },
  outfitThumb: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 15,
    backgroundColor: "#f4e9e4",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 15,
  },
  detailTitle: {
    fontSize: 23,
    color: "#292423",
    fontWeight: "800",
    marginTop: 2,
  },
  selectionBar: {
    marginHorizontal: 20,
    padding: 11,
    borderRadius: 11,
    backgroundColor: "#f7eae5",
    flexDirection: "row",
    justifyContent: "space-between",
    color: "#5b4f4b",
  },
  deleteText: { color: "#b13e31", fontWeight: "800" },
  grid: { paddingHorizontal: 15, paddingBottom: 90 },
  selectionGrid: { flexDirection: "row", flexWrap: "wrap" },
  gridCard: { width: "33.333%", padding: 5, position: "relative" },
  sortableGridCard: { width: "100%", aspectRatio: 1, position: "relative" },
  gridImage: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 13,
    backgroundColor: "#eee4df",
  },
  selectedCard: { opacity: 0.64 },
  check: {
    position: "absolute",
    right: 10,
    top: 10,
    backgroundColor: "#b8604e",
    borderRadius: 12,
    height: 22,
  },
  floatingAdd: {
    position: "absolute",
    bottom: 22,
    alignSelf: "center",
    width: 55,
    height: 55,
    borderRadius: 28,
    backgroundColor: "#b8604e",
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
  },
  previewModal: {
    flex: 1,
    backgroundColor: "rgba(20, 16, 15, 0.94)",
    justifyContent: "center",
    alignItems: "center",
    padding: 22,
  },
  previewImage: { width: "100%", height: "82%" },
  previewClose: {
    position: "absolute",
    top: Platform.OS === "ios" ? 58 : 26,
    right: 22,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.16)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  modalShade: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(45,35,31,.4)",
  },
  sheet: {
    backgroundColor: "#fffaf7",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 20,
    paddingBottom: 28,
  },
  sheetGrip: {
    alignSelf: "center",
    width: 36,
    height: 4,
    backgroundColor: "#decfc9",
    borderRadius: 3,
    marginBottom: 14,
  },
  sheetTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sheetTitle: { fontSize: 20, fontWeight: "800", color: "#2f2927" },
  fieldLabel: {
    color: "#453c3a",
    fontWeight: "700",
    marginTop: 19,
    fontSize: 14,
  },
  required: { color: "#c84d3c" },
  uploadRow: { flexDirection: "row", flexWrap: "wrap", gap: 9, marginTop: 10 },
  previewWrap: { width: 67, height: 67 },
  preview: { width: "100%", height: "100%", borderRadius: 10 },
  removePreview: {
    position: "absolute",
    right: -5,
    top: -5,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#7b4a41",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadTile: {
    width: 67,
    height: 67,
    borderRadius: 10,
    borderColor: "#d9c7c0",
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  uploadText: { color: "#8a7068", fontSize: 11, marginTop: 2 },
  sourceRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  sourceButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#f3ebe7",
    borderRadius: 9,
  },
  sourceText: { fontSize: 12, color: "#725b55", fontWeight: "600" },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 22 },
  secondaryButton: {
    flex: 1,
    height: 48,
    borderRadius: 13,
    backgroundColor: "#f0e8e4",
    justifyContent: "center",
    alignItems: "center",
  },
  confirmButton: {
    flex: 1.5,
    height: 48,
    borderRadius: 13,
    backgroundColor: "#b8604e",
    justifyContent: "center",
    alignItems: "center",
  },
  chooser: {
    minHeight: 390,
    maxHeight: "76%",
    backgroundColor: "#fffaf7",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    padding: 20,
  },
  chooserGrid: { paddingTop: 14 },
  choice: { width: "33.333%", padding: 5 },
  choiceImage: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 11,
    backgroundColor: "#efe5e0",
  },
  choiceText: {
    fontSize: 11,
    color: "#6c615d",
    marginTop: 4,
    textAlign: "center",
  },
});
