import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { Alert, Image, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { CLOTHING_CATEGORIES, ClothingCategory } from "../constants";
import { styles } from "../styles";
import { Chip } from "./Chip";
import { ImageSourcePicker } from "./ImageSourcePicker";

export function AddClothingModal({
  visible,
  initialCategory,
  existingImageUris,
  onClose,
  onSave,
}: {
  visible: boolean;
  initialCategory: ClothingCategory;
  existingImageUris: string[];
  onClose: () => void;
  onSave: (c: ClothingCategory, images: string[]) => Promise<void>;
}) {
  const [category, setCategory] = useState<ClothingCategory>(initialCategory);
  const [images, setImages] = useState<string[]>([]);
  const [showImageSourcePicker, setShowImageSourcePicker] = useState(false);
  useEffect(() => {
    if (visible) {
      setCategory(initialCategory);
      setImages([]);
    }
  }, [visible, initialCategory]);

  function imageKey(uri: string) {
    try {
      return decodeURIComponent(uri.split("?")[0]).toLowerCase();
    } catch {
      return uri.split("?")[0].toLowerCase();
    }
  }

  function appendImages(nextUris: string[]) {
    const known = new Set(
      [...existingImageUris, ...images].map((uri) => imageKey(uri)),
    );
    const unique: string[] = [];
    let duplicateCount = 0;
    for (const uri of nextUris) {
      const key = imageKey(uri);
      if (known.has(key)) {
        duplicateCount += 1;
      } else {
        known.add(key);
        unique.push(uri);
      }
    }
    if (unique.length) setImages((previous) => [...previous, ...unique]);
    if (duplicateCount) {
      Alert.alert(
        "图片已存在",
        duplicateCount === 1
          ? "这张图片已经添加过了。"
          : `有 ${duplicateCount} 张图片已经添加过，本次已自动跳过。`,
      );
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
              onPress={() => setShowImageSourcePicker(true)}
            >
              <Ionicons name="add" size={25} color="#aa796d" />
              <Text style={styles.uploadText}>添加图片</Text>
            </Pressable>
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
          <ImageSourcePicker
            visible={showImageSourcePicker}
            onClose={() => setShowImageSourcePicker(false)}
            onPick={appendImages}
          />
        </View>
      </View>
    </Modal>
  );
}
