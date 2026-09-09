import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import { Alert, Image, Modal, Pressable, ScrollView, Text, View } from "react-native";
import { CLOTHING_CATEGORIES, ClothingCategory } from "../constants";
import { styles } from "../styles";
import { Chip } from "./Chip";

export function AddClothingModal({
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

