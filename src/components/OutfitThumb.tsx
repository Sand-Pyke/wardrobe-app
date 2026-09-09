import { Ionicons } from "@expo/vector-icons";
import { Image, View } from "react-native";
import { Outfit } from "../types";
import { styles } from "../styles";

export function OutfitThumb({ outfit }: { outfit: Outfit }) {
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

