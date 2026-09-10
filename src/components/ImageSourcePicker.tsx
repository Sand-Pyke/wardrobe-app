import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { Alert, Modal, Pressable, Text, View } from "react-native";
import { styles } from "../styles";

type ImageSource = "camera" | "library" | "files";

const IMAGE_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/bmp",
  "image/heic",
  "image/heif",
];

export function ImageSourcePicker({
  visible,
  onClose,
  onPick,
}: {
  visible: boolean;
  onClose: () => void;
  onPick: (uris: string[]) => void | Promise<void>;
}) {
  async function pick(source: ImageSource) {
    try {
      if (source === "files") {
        const result = await DocumentPicker.getDocumentAsync({
          type: IMAGE_FILE_TYPES,
          multiple: true,
          copyToCacheDirectory: true,
        });
        if (!result.canceled) {
          await onPick(result.assets.map((asset) => asset.uri));
          onClose();
        }
        return;
      }

      if (source === "camera") {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert("需要相机权限", "请在系统设置中允许访问相机。");
          return;
        }
        const result = await ImagePicker.launchCameraAsync({
          mediaTypes: ["images"],
          quality: 0.8,
        });
        if (!result.canceled) {
          await onPick([result.assets[0].uri]);
          onClose();
        }
        return;
      }

      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert("需要相册权限", "请在系统设置中允许访问相册。");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        selectionLimit: 10,
        quality: 0.8,
      });
      if (!result.canceled) {
        await onPick(result.assets.map((asset) => asset.uri));
        onClose();
      }
    } catch {
      Alert.alert("选择图片失败", "请稍后重试。");
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalShade}>
        <View style={styles.sheet}>
          <View style={styles.sheetGrip} />
          <View style={styles.sheetTitleRow}>
            <View>
              <Text style={styles.sheetTitle}>添加图片</Text>
              <Text style={styles.tip}>选择图片来源</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={24} color="#292423" />
            </Pressable>
          </View>
          <View style={styles.imageSourceOptions}>
            <SourceOption
              icon="camera-outline"
              title="相机"
              subtitle="拍摄一张新照片"
              onPress={() => void pick("camera")}
            />
            <SourceOption
              icon="images-outline"
              title="相册"
              subtitle="从相册中选择图片"
              onPress={() => void pick("library")}
            />
            <SourceOption
              icon="folder-open-outline"
              title="本地文件"
              subtitle="支持 JPG、JPEG、PNG 等图片"
              onPress={() => void pick("files")}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
}

function SourceOption({
  icon,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.imageSourceOption} onPress={onPress}>
      <View style={styles.imageSourceIcon}>
        <Ionicons name={icon} size={22} color="#aa796d" />
      </View>
      <View style={styles.imageSourceCopy}>
        <Text style={styles.imageSourceTitle}>{title}</Text>
        <Text style={styles.imageSourceSubtitle}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#b6a5a0" />
    </Pressable>
  );
}
