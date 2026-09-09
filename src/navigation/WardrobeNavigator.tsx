import { useState } from "react";
import { Alert, StatusBar, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AddClothingModal } from "../components/AddClothingModal";
import { BottomTabs } from "../components/BottomTabs";
import { ClothingCategory } from "../constants";
import { useWardrobeData } from "../hooks/useWardrobeData";
import { Collection } from "../screens/CollectionScreen";
import { DetailScreen } from "../screens/DetailScreen";
import { Home } from "../screens/HomeScreen";
import { Styling } from "../screens/StylingScreen";
import { styles } from "../styles";
import { Outfit } from "../types";
import { DetailRoute, Tab } from "./types";

export function WardrobeNavigator() {
  const insets = useSafeAreaInsets();
  const wardrobe = useWardrobeData();
  const [tab, setTab] = useState<Tab>("home");
  const [detail, setDetail] = useState<DetailRoute>(null);
  const [addCategory, setAddCategory] = useState<ClothingCategory | null>(null);
  const [editingOutfit, setEditingOutfit] = useState<Outfit | null>(null);
  const safeFrame = {
    paddingTop: insets.top,
    paddingLeft: insets.left,
    paddingRight: insets.right,
  };

  function openAdd(category?: ClothingCategory) {
    setAddCategory(category ?? "top");
  }

  if (detail) {
    return (
      <View style={[styles.safe, safeFrame]}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#fffaf7"
          translucent
        />
        <DetailScreen
          detail={detail}
          items={wardrobe.items}
          outfits={wardrobe.outfits}
          onBack={() => setDetail(null)}
          onAdd={openAdd}
          onDeleteItems={wardrobe.deleteItems}
          onDeleteOutfits={wardrobe.deleteOutfits}
          onOpenOutfit={(outfit) => {
            setDetail(null);
            setEditingOutfit(outfit);
            setTab("style");
          }}
          onReorderItems={wardrobe.persistItems}
          onReorderOutfits={wardrobe.persistOutfits}
        />
        <AddClothingModal
          visible={addCategory !== null}
          initialCategory={addCategory ?? "top"}
          existingImageUris={wardrobe.items.flatMap((item) => item.imageUris)}
          onClose={() => setAddCategory(null)}
          onSave={async (category, uris) => {
            await wardrobe.addItems(category, uris);
            setAddCategory(null);
          }}
        />
      </View>
    );
  }

  return (
    <View style={[styles.safe, safeFrame]}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#fffaf7"
        translucent
      />
      <View style={styles.page}>
        {tab === "home" && (
          <Home
            items={wardrobe.items}
            onAdd={openAdd}
            onOpenCategory={(category) =>
              setDetail({ type: "clothing", category })
            }
          />
        )}
        {tab === "style" && (
          <Styling
            items={wardrobe.items}
            editing={editingOutfit}
            onCancelEdit={() => setEditingOutfit(null)}
            onSave={async (outfit, isNewCategory) => {
              const wasEditing = editingOutfit !== null;
              await wardrobe.saveOutfit(outfit, isNewCategory);
              setEditingOutfit(null);
              setTab("collection");
              Alert.alert(
                wasEditing ? "修改成功" : "保存成功",
                wasEditing
                  ? "穿搭记录已经更新。"
                  : "这套穿搭已经加入收藏。",
              );
            }}
          />
        )}
        {tab === "collection" && (
          <Collection
            outfits={wardrobe.outfits}
            customCategories={wardrobe.customCategories}
            onOpenCategory={(category) =>
              setDetail({ type: "outfit", category })
            }
            onOpenOutfit={(outfit) => {
              setEditingOutfit(outfit);
              setTab("style");
            }}
            onStyle={() => setTab("style")}
            onDeleteOutfits={wardrobe.deleteOutfits}
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
        existingImageUris={wardrobe.items.flatMap((item) => item.imageUris)}
        onClose={() => setAddCategory(null)}
        onSave={async (category, uris) => {
          await wardrobe.addItems(category, uris);
          setAddCategory(null);
        }}
      />
    </View>
  );
}
