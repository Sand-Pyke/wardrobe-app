import * as ImageManipulator from "expo-image-manipulator";
import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

type ImageSize = { width: number; height: number };

const MIN_CROP_SIZE = 80;
const CORNER_HIT_SIZE = 38;

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function ImageCropModal({
  uri,
  onCancel,
  onComplete,
}: {
  uri: string | null;
  onCancel: () => void;
  onComplete: (croppedUri: string) => void | Promise<void>;
}) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const cropSize = Math.max(
    220,
    Math.min(windowWidth - 40, windowHeight - 210, 430),
  );
  const initialInset = Math.min(24, cropSize * 0.08);
  const [imageSize, setImageSize] = useState<ImageSize | null>(null);
  const [saving, setSaving] = useState(false);

  const zoom = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const pinchStartZoom = useSharedValue(1);
  const panStartX = useSharedValue(0);
  const panStartY = useSharedValue(0);

  const cropLeft = useSharedValue(initialInset);
  const cropTop = useSharedValue(initialInset);
  const cropWidth = useSharedValue(cropSize - initialInset * 2);
  const cropHeight = useSharedValue(cropSize - initialInset * 2);
  const cropStartLeft = useSharedValue(initialInset);
  const cropStartTop = useSharedValue(initialInset);
  const cropStartWidth = useSharedValue(cropSize - initialInset * 2);
  const cropStartHeight = useSharedValue(cropSize - initialInset * 2);
  const activeDragMode = useSharedValue(0);

  useEffect(() => {
    if (!uri) return;
    setImageSize(null);
    zoom.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    cropLeft.value = initialInset;
    cropTop.value = initialInset;
    cropWidth.value = cropSize - initialInset * 2;
    cropHeight.value = cropSize - initialInset * 2;
    Image.getSize(
      uri,
      (width, height) => setImageSize({ width, height }),
      () => Alert.alert("无法读取图片", "请重新选择图片后再试。"),
    );
  }, [
    cropHeight,
    cropLeft,
    cropSize,
    cropTop,
    cropWidth,
    initialInset,
    translateX,
    translateY,
    uri,
    zoom,
  ]);

  const renderedSize = useMemo(() => {
    if (!imageSize) return null;
    const baseScale = Math.max(
      cropSize / imageSize.width,
      cropSize / imageSize.height,
    );
    return {
      width: imageSize.width * baseScale,
      height: imageSize.height * baseScale,
      baseScale,
    };
  }, [cropSize, imageSize]);

  const pinch = Gesture.Pinch()
    .onBegin(() => {
      pinchStartZoom.value = zoom.value;
    })
    .onUpdate((event) => {
      if (!renderedSize) return;
      const nextZoom = Math.min(
        Math.max(pinchStartZoom.value * event.scale, 1),
        4,
      );
      zoom.value = nextZoom;
      const maxX = Math.max(0, (renderedSize.width * nextZoom - cropSize) / 2);
      const maxY = Math.max(0, (renderedSize.height * nextZoom - cropSize) / 2);
      translateX.value = Math.min(Math.max(translateX.value, -maxX), maxX);
      translateY.value = Math.min(Math.max(translateY.value, -maxY), maxY);
    });

  const pan = Gesture.Pan()
    .onBegin((event) => {
      panStartX.value = translateX.value;
      panStartY.value = translateY.value;
      cropStartLeft.value = cropLeft.value;
      cropStartTop.value = cropTop.value;
      cropStartWidth.value = cropWidth.value;
      cropStartHeight.value = cropHeight.value;

      const right = cropLeft.value + cropWidth.value;
      const bottom = cropTop.value + cropHeight.value;
      const nearLeft = Math.abs(event.x - cropLeft.value) <= CORNER_HIT_SIZE;
      const nearRight = Math.abs(event.x - right) <= CORNER_HIT_SIZE;
      const nearTop = Math.abs(event.y - cropTop.value) <= CORNER_HIT_SIZE;
      const nearBottom = Math.abs(event.y - bottom) <= CORNER_HIT_SIZE;

      if (nearLeft && nearTop) activeDragMode.value = 1;
      else if (nearRight && nearTop) activeDragMode.value = 2;
      else if (nearRight && nearBottom) activeDragMode.value = 3;
      else if (nearLeft && nearBottom) activeDragMode.value = 4;
      else activeDragMode.value = 0;
    })
    .onUpdate((event) => {
      if (!renderedSize) return;

      const startRight = cropStartLeft.value + cropStartWidth.value;
      const startBottom = cropStartTop.value + cropStartHeight.value;

      if (activeDragMode.value === 1) {
        const nextLeft = Math.min(
          Math.max(cropStartLeft.value + event.translationX, 0),
          startRight - MIN_CROP_SIZE,
        );
        const nextTop = Math.min(
          Math.max(cropStartTop.value + event.translationY, 0),
          startBottom - MIN_CROP_SIZE,
        );
        cropLeft.value = nextLeft;
        cropTop.value = nextTop;
        cropWidth.value = startRight - nextLeft;
        cropHeight.value = startBottom - nextTop;
        return;
      }

      if (activeDragMode.value === 2) {
        const nextRight = Math.min(
          Math.max(
            startRight + event.translationX,
            cropStartLeft.value + MIN_CROP_SIZE,
          ),
          cropSize,
        );
        const nextTop = Math.min(
          Math.max(cropStartTop.value + event.translationY, 0),
          startBottom - MIN_CROP_SIZE,
        );
        cropTop.value = nextTop;
        cropWidth.value = nextRight - cropStartLeft.value;
        cropHeight.value = startBottom - nextTop;
        return;
      }

      if (activeDragMode.value === 3) {
        const nextRight = Math.min(
          Math.max(
            startRight + event.translationX,
            cropStartLeft.value + MIN_CROP_SIZE,
          ),
          cropSize,
        );
        const nextBottom = Math.min(
          Math.max(
            startBottom + event.translationY,
            cropStartTop.value + MIN_CROP_SIZE,
          ),
          cropSize,
        );
        cropWidth.value = nextRight - cropStartLeft.value;
        cropHeight.value = nextBottom - cropStartTop.value;
        return;
      }

      if (activeDragMode.value === 4) {
        const nextLeft = Math.min(
          Math.max(cropStartLeft.value + event.translationX, 0),
          startRight - MIN_CROP_SIZE,
        );
        const nextBottom = Math.min(
          Math.max(
            startBottom + event.translationY,
            cropStartTop.value + MIN_CROP_SIZE,
          ),
          cropSize,
        );
        cropLeft.value = nextLeft;
        cropWidth.value = startRight - nextLeft;
        cropHeight.value = nextBottom - cropStartTop.value;
        return;
      }

      const maxX = Math.max(0, (renderedSize.width * zoom.value - cropSize) / 2);
      const maxY = Math.max(0, (renderedSize.height * zoom.value - cropSize) / 2);
      translateX.value = Math.min(
        Math.max(panStartX.value + event.translationX, -maxX),
        maxX,
      );
      translateY.value = Math.min(
        Math.max(panStartY.value + event.translationY, -maxY),
        maxY,
      );
    });

  const imageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: zoom.value },
    ],
  }));

  const cropFrameStyle = useAnimatedStyle(() => ({
    left: cropLeft.value,
    top: cropTop.value,
    width: cropWidth.value,
    height: cropHeight.value,
  }));

  const topMaskStyle = useAnimatedStyle(() => ({
    left: 0,
    top: 0,
    width: cropSize,
    height: cropTop.value,
  }));

  const bottomMaskStyle = useAnimatedStyle(() => ({
    left: 0,
    top: cropTop.value + cropHeight.value,
    width: cropSize,
    height: cropSize - cropTop.value - cropHeight.value,
  }));

  const leftMaskStyle = useAnimatedStyle(() => ({
    left: 0,
    top: cropTop.value,
    width: cropLeft.value,
    height: cropHeight.value,
  }));

  const rightMaskStyle = useAnimatedStyle(() => ({
    left: cropLeft.value + cropWidth.value,
    top: cropTop.value,
    width: cropSize - cropLeft.value - cropWidth.value,
    height: cropHeight.value,
  }));

  async function saveCrop() {
    if (!uri || !imageSize || !renderedSize || saving) return;
    setSaving(true);
    try {
      const totalScale = renderedSize.baseScale * zoom.value;
      const imageLeft =
        (cropSize - renderedSize.width * zoom.value) / 2 + translateX.value;
      const imageTop =
        (cropSize - renderedSize.height * zoom.value) / 2 + translateY.value;
      const selectedWidth = Math.min(
        imageSize.width,
        cropWidth.value / totalScale,
      );
      const selectedHeight = Math.min(
        imageSize.height,
        cropHeight.value / totalScale,
      );
      const originX = clamp(
        (cropLeft.value - imageLeft) / totalScale,
        0,
        imageSize.width - selectedWidth,
      );
      const originY = clamp(
        (cropTop.value - imageTop) / totalScale,
        0,
        imageSize.height - selectedHeight,
      );
      const finalWidth = Math.max(1, Math.floor(selectedWidth));
      const finalHeight = Math.max(1, Math.floor(selectedHeight));
      const finalOriginX = Math.max(
        0,
        Math.min(Math.floor(originX), imageSize.width - finalWidth),
      );
      const finalOriginY = Math.max(
        0,
        Math.min(Math.floor(originY), imageSize.height - finalHeight),
      );
      const normalizedUri = uri.split("?")[0].toLowerCase();
      const format = normalizedUri.endsWith(".png")
        ? ImageManipulator.SaveFormat.PNG
        : normalizedUri.endsWith(".webp")
          ? ImageManipulator.SaveFormat.WEBP
          : ImageManipulator.SaveFormat.JPEG;
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [
          {
            crop: {
              originX: finalOriginX,
              originY: finalOriginY,
              width: finalWidth,
              height: finalHeight,
            },
          },
        ],
        { compress: 0.9, format },
      );
      await onComplete(result.uri);
    } catch {
      Alert.alert("裁剪失败", "请稍后重试。原图片没有被修改。");
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={cropStyles.root}>
      <View style={cropStyles.header}>
        <Pressable onPress={onCancel} hitSlop={10}>
          <Text style={cropStyles.headerAction}>取消</Text>
        </Pressable>
        <Text style={cropStyles.title}>裁剪图片</Text>
        <Pressable onPress={() => void saveCrop()} hitSlop={10}>
          <Text style={[cropStyles.headerAction, cropStyles.saveAction]}>
            {saving ? "处理中" : "完成"}
          </Text>
        </Pressable>
      </View>
      <View style={cropStyles.content}>
        {renderedSize && uri && (
          <GestureDetector gesture={Gesture.Simultaneous(pinch, pan)}>
            <View
              style={[cropStyles.viewport, { width: cropSize, height: cropSize }]}
            >
              <Animated.Image
                source={{ uri }}
                resizeMode="cover"
                style={[
                  { width: renderedSize.width, height: renderedSize.height },
                  imageStyle,
                ]}
              />
              <View pointerEvents="none" style={StyleSheet.absoluteFill}>
                <Animated.View style={[cropStyles.mask, topMaskStyle]} />
                <Animated.View style={[cropStyles.mask, bottomMaskStyle]} />
                <Animated.View style={[cropStyles.mask, leftMaskStyle]} />
                <Animated.View style={[cropStyles.mask, rightMaskStyle]} />
                <Animated.View style={[cropStyles.cropFrame, cropFrameStyle]}>
                  <View style={[cropStyles.cornerHandle, cropStyles.topLeft]} />
                  <View style={[cropStyles.cornerHandle, cropStyles.topRight]} />
                  <View style={[cropStyles.cornerHandle, cropStyles.bottomRight]} />
                  <View style={[cropStyles.cornerHandle, cropStyles.bottomLeft]} />
                </Animated.View>
              </View>
            </View>
          </GestureDetector>
        )}
        <Text style={cropStyles.hint}>
          拖动图片调整位置，拖动四角调整裁剪范围，双指缩放
        </Text>
      </View>
    </View>
  );
}

const cropStyles = StyleSheet.create({
  root: { flex: 1, width: "100%", backgroundColor: "#090807" },
  header: {
    height: 98,
    paddingTop: 48,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: { color: "#fff", fontSize: 17, fontWeight: "700" },
  headerAction: { color: "#d8cbc6", fontSize: 15, minWidth: 48 },
  saveAction: { color: "#e9927d", textAlign: "right", fontWeight: "700" },
  content: { flex: 1, alignItems: "center", justifyContent: "center" },
  viewport: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#171311",
  },
  mask: {
    position: "absolute",
    backgroundColor: "rgba(0,0,0,.58)",
  },
  cropFrame: {
    position: "absolute",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,.95)",
  },
  cornerHandle: {
    position: "absolute",
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: "#c9624d",
  },
  topLeft: { left: -10, top: -10 },
  topRight: { right: -10, top: -10 },
  bottomRight: { right: -10, bottom: -10 },
  bottomLeft: { left: -10, bottom: -10 },
  hint: {
    color: "rgba(255,255,255,.68)",
    fontSize: 13,
    marginTop: 22,
    paddingHorizontal: 20,
    textAlign: "center",
  },
});
