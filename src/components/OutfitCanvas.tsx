import { Image, StyleSheet, View } from "react-native";
import { Outfit } from "../types";

export function OutfitCanvas({
  outfit,
  compact = false,
}: {
  outfit: Outfit;
  compact?: boolean;
}) {
  const { head, neck, torso, legs, feet } = outfit.parts;
  const isDress = torso?.category === "dress";
  return (
    <View
      style={[
        canvasStyles.canvas,
        compact ? canvasStyles.compact : canvasStyles.preview,
      ]}
    >
      {head && (
        <Image
          source={{ uri: head.imageUris[0] }}
          style={[canvasStyles.part, canvasStyles.head]}
          resizeMode="cover"
        />
      )}
      {neck && (
        <Image
          source={{ uri: neck.imageUris[0] }}
          style={[canvasStyles.part, canvasStyles.neck]}
          resizeMode="cover"
        />
      )}
      {torso && (
        <Image
          source={{ uri: torso.imageUris[0] }}
          style={[
            canvasStyles.part,
            canvasStyles.torso,
            isDress && canvasStyles.dress,
          ]}
          resizeMode="cover"
        />
      )}
      {!isDress && legs && (
        <Image
          source={{ uri: legs.imageUris[0] }}
          style={[canvasStyles.part, canvasStyles.legs]}
          resizeMode="cover"
        />
      )}
      {feet && (
        <Image
          source={{ uri: feet.imageUris[0] }}
          style={[canvasStyles.part, canvasStyles.feet]}
          resizeMode="cover"
        />
      )}
    </View>
  );
}

const canvasStyles = StyleSheet.create({
  canvas: {
    width: "100%",
    aspectRatio: 0.78,
    backgroundColor: "#f8efeb",
    borderRadius: 24,
    overflow: "hidden",
    position: "relative",
  },
  compact: {
    aspectRatio: 1,
    borderRadius: 15,
  },
  preview: { maxHeight: "82%" },
  part: {
    position: "absolute",
    backgroundColor: "#eadeda",
    borderRadius: 12,
  },
  head: { top: "3%", left: "35%", width: "30%", height: "18%" },
  neck: { top: "18%", left: "40%", width: "20%", height: "9%", zIndex: 2 },
  torso: { top: "25%", left: "20%", width: "60%", height: "35%", zIndex: 1 },
  dress: { height: "58%" },
  legs: { top: "61%", left: "25%", width: "50%", height: "25%" },
  feet: { top: "87%", left: "19%", width: "62%", height: "10%" },
});
