import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { ClothingCategory, CLOTHING_CATEGORIES, DEFAULT_OUTFIT_CATEGORIES, OutfitPart, PART_ALLOWED, PART_LABELS } from "../constants";
import { ClothingItem, Outfit } from "../types";
import { styles } from "../styles";
import { Empty } from "../components/Empty";
import { Chip } from "../components/Chip";

const createId = () =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const nameOf = (value: ClothingCategory) =>
  CLOTHING_CATEGORIES.find((entry) => entry.value === value)?.label ?? value;

export function Styling({
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
  const scrollRef = useRef<ScrollView>(null);
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
    <KeyboardAvoidingView
      style={styles.keyboardAvoiding}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[styles.scroll, styles.stylingScroll]}
        keyboardShouldPersistTaps="handled"
      >
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
        onFocus={() => {
          setTimeout(
            () => scrollRef.current?.scrollToEnd({ animated: true }),
            150,
          );
        }}
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
              id: editing?.id ?? createId(),
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
    </KeyboardAvoidingView>
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
