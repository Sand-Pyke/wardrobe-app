import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  FadeIn,
  FadeOut,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { ClothingCategory, CLOTHING_CATEGORIES, DEFAULT_OUTFIT_CATEGORIES, OutfitPart, PART_ALLOWED, PART_LABELS } from "../constants";
import { ClothingItem, Outfit } from "../types";
import { styles } from "../styles";
import { Empty } from "../components/Empty";
import { Chip } from "../components/Chip";

const createId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const nameOf = (value: ClothingCategory) =>
  CLOTHING_CATEGORIES.find((entry) => entry.value === value)?.label ?? value;
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const TILT_SPRING = { damping: 15, stiffness: 135, mass: 0.72 };

export function Styling({
  items,
  editing,
  customCategories,
  onCancelEdit,
  onSave,
}: {
  items: ClothingItem[];
  editing: Outfit | null;
  customCategories: string[];
  onCancelEdit: () => void;
  onSave: (outfit: Outfit, isNew: boolean) => Promise<void>;
}) {
  const { height: viewportHeight } = useWindowDimensions();
  const [parts, setParts] = useState<Partial<Record<OutfitPart, ClothingItem>>>(
    editing?.parts ?? {},
  );
  const [category, setCategory] = useState(editing?.category ?? "春夏");
  const [pendingCategory, setPendingCategory] = useState(category);
  const [chooser, setChooser] = useState<OutfitPart | null>(null);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  useEffect(() => {
    setParts(editing?.parts ?? {});
    setCategory(editing?.category ?? "春夏");
    setPendingCategory(editing?.category ?? "春夏");
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
  const mannequinHeight = Math.max(500, Math.min(680, viewportHeight - 220));
  const categoryOptions = Array.from(
    new Set<string>([...DEFAULT_OUTFIT_CATEGORIES, ...customCategories, category]),
  );
  function saveOutfit(selectedCategory: string) {
    setShowCategoryPicker(false);
    void onSave(
      {
        id: editing?.id ?? createId(),
        category: selectedCategory,
        parts,
        createdAt: editing?.createdAt ?? new Date().toISOString(),
        sortOrder: editing?.sortOrder ?? 0,
      },
      false,
    );
  }
  return (
      <ScrollView contentContainerStyle={[styles.scroll, styles.stylingScroll]}>
      <View style={styles.topline}>
        <View>
          <Text style={styles.eyebrow}>
            {editing ? "EDIT OUTFIT" : "CREATE AN OUTFIT"}
          </Text>
          <Text style={styles.title}>{editing ? "编辑穿搭" : "今日搭配"}</Text>
        </View>
        <View style={styles.headerActions}>
          {editing && (
            <Pressable onPress={onCancelEdit} hitSlop={10}>
              <Text style={styles.cancelText}>取消</Text>
            </Pressable>
          )}
          {valid && (
            <Pressable
              style={styles.headerSave}
              onPress={() => {
                setPendingCategory(category);
                setShowCategoryPicker(true);
              }}
              accessibilityRole="button"
              accessibilityLabel="选择分类并保存搭配"
            >
              <Ionicons name="checkmark" color="#fff" size={22} />
            </Pressable>
          )}
        </View>
      </View>
      <Text style={styles.helper}>
        点按假人部位，选择衣柜里的单品；完成后点击右上角 ✓ 保存
      </Text>
      <Mannequin
        parts={parts}
        isDress={isDress}
        height={mannequinHeight}
        onPress={(part) => setChooser(part)}
      />
      <ItemChooser
        visible={chooser !== null}
        part={chooser}
        items={items}
        onClose={() => setChooser(null)}
        onPick={choose}
      />
      <CategorySaveModal
        visible={showCategoryPicker}
        categories={categoryOptions}
        selectedCategory={pendingCategory}
        onSelect={setPendingCategory}
        onCancel={() => setShowCategoryPicker(false)}
        onSave={() => saveOutfit(pendingCategory)}
      />
      </ScrollView>
  );
}

function CategorySaveModal({
  visible,
  categories,
  selectedCategory,
  onSelect,
  onCancel,
  onSave,
}: {
  visible: boolean;
  categories: string[];
  selectedCategory: string;
  onSelect: (category: string) => void;
  onCancel: () => void;
  onSave: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.modalShade}>
        <View style={styles.sheet}>
          <View style={styles.sheetGrip} />
          <Text style={styles.sheetTitle}>选择穿搭分类</Text>
          <Text style={styles.tip}>选择分类后再保存这套搭配</Text>
          <View style={styles.chips}>
            {categories.map((item) => (
              <Chip
                key={item}
                selected={selectedCategory === item}
                text={item}
                onPress={() => onSelect(item)}
              />
            ))}
          </View>
          <View style={styles.modalActions}>
            <Pressable style={styles.secondaryButton} onPress={onCancel}>
              <Text style={styles.cancelText}>取消</Text>
            </Pressable>
            <Pressable style={styles.confirmButton} onPress={onSave}>
              <Text style={styles.primaryText}>保存</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Mannequin({
  parts,
  isDress,
  height,
  onPress,
}: {
  parts: Partial<Record<OutfitPart, ClothingItem>>;
  isDress: boolean;
  height: number;
  onPress: (part: OutfitPart) => void;
}) {
  const image = (part: OutfitPart) => parts[part]?.imageUris[0];
  const scale = height / 500;
  const scaled = (value: number) => Math.round(value * scale);
  const rotateX = useSharedValue(0);
  const rotateY = useSharedValue(0);

  const tiltGesture = Gesture.Pan()
    .minDistance(7)
    .onUpdate((event) => {
      rotateY.value = Math.max(-9, Math.min(9, event.translationX / 16));
      rotateX.value = Math.max(-6, Math.min(6, -event.translationY / 22));
    })
    .onFinalize(() => {
      rotateX.value = withSpring(0, TILT_SPRING);
      rotateY.value = withSpring(0, TILT_SPRING);
    });

  const stageStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 900 },
      { rotateX: `${rotateX.value}deg` },
      { rotateY: `${rotateY.value}deg` },
      {
        scale: interpolate(
          Math.abs(rotateX.value) + Math.abs(rotateY.value),
          [0, 15],
          [1, 1.018],
        ),
      },
    ],
  }));
  const shadowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(Math.abs(rotateY.value), [0, 9], [0.2, 0.12]),
    transform: [
      { translateX: rotateY.value * 1.7 },
      {
        scaleX: interpolate(Math.abs(rotateY.value), [0, 9], [1, 0.86]),
      },
    ],
  }));
  const headDepthStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: rotateY.value * 0.72 },
      { translateY: -rotateX.value * 0.28 },
    ],
  }));
  const neckDepthStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: rotateY.value * 0.5 },
      { translateY: -rotateX.value * 0.18 },
    ],
  }));
  const torsoDepthStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: rotateY.value * 0.3 },
      { translateY: -rotateX.value * 0.1 },
    ],
  }));
  const legsDepthStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: rotateY.value * 0.16 },
      { translateY: rotateX.value * 0.08 },
    ],
  }));
  const feetDepthStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: rotateY.value * 0.42 },
      { translateY: rotateX.value * 0.2 },
    ],
  }));

  const partImage = (part: OutfitPart) => {
    const uri = image(part);
    return uri ? (
      <Animated.Image
        key={uri}
        source={{ uri }}
        style={styles.partImage}
        entering={FadeIn.duration(220).springify().damping(18)}
        exiting={FadeOut.duration(130)}
      />
    ) : null;
  };

  return (
    <GestureDetector gesture={tiltGesture}>
      <Animated.View
        style={[styles.mannequinWrap, { height }, stageStyle]}
        accessibilityLabel="可拖动查看立体搭配"
      >
        <View pointerEvents="none" style={styles.mannequinGlow} />
        <Animated.View
          pointerEvents="none"
          style={[styles.mannequinGroundShadow, shadowStyle]}
        />
        <AnimatedPressable
          style={[
            styles.manHead,
            {
              height: scaled(76),
              width: scaled(79),
              borderRadius: scaled(40),
            },
            headDepthStyle,
          ]}
          onPress={() => onPress("head")}
        >
          {partImage("head") ?? <PartHint icon="add" text="帽子" />}
        </AnimatedPressable>
        <AnimatedPressable
          style={[
            styles.manNeck,
            {
              height: scaled(41),
              width: scaled(62),
              borderRadius: scaled(11),
              marginTop: scaled(-4),
            },
            neckDepthStyle,
          ]}
          onPress={() => onPress("neck")}
        >
          {partImage("neck") ?? <PartHint icon="add" text="围巾" />}
        </AnimatedPressable>
        <AnimatedPressable
          style={[
            styles.manTorso,
            {
              width: scaled(201),
              height: scaled(165),
              borderRadius: scaled(51),
              marginTop: scaled(-1),
            },
            isDress && styles.manDress,
            isDress && {
              height: scaled(290),
              borderBottomLeftRadius: scaled(80),
              borderBottomRightRadius: scaled(80),
            },
            torsoDepthStyle,
          ]}
          onPress={() => onPress("torso")}
        >
          {partImage("torso") ?? (
            <PartHint icon="add" text="上衣 / 连衣裙" />
          )}
        </AnimatedPressable>
        {!isDress && (
          <AnimatedPressable
            style={[
              styles.manLegs,
              {
                width: scaled(143),
                height: scaled(128),
                marginTop: scaled(2),
                borderBottomLeftRadius: scaled(29),
                borderBottomRightRadius: scaled(29),
              },
              legsDepthStyle,
            ]}
            onPress={() => onPress("legs")}
          >
            {partImage("legs") ?? (
              <PartHint icon="add" text="裤子 / 裙子" />
            )}
          </AnimatedPressable>
        )}
        <AnimatedPressable
          style={[
            styles.manFeet,
            {
              width: scaled(180),
              height: scaled(59),
              borderRadius: scaled(21),
              marginTop: scaled(5),
            },
            isDress && styles.manFeetDress,
            isDress && { marginTop: scaled(6) },
            feetDepthStyle,
          ]}
          onPress={() => onPress("feet")}
        >
          {partImage("feet") ?? (
            <PartHint icon="add" text="袜子 / 鞋子" />
          )}
        </AnimatedPressable>
      </Animated.View>
    </GestureDetector>
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
