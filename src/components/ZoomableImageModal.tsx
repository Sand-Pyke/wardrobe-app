import { useEffect, useState } from "react";
import { Alert, Modal, StyleSheet } from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { ImageCropModal } from "./ImageCropModal";

export function ZoomableImageModal({
  uri,
  onClose,
  onReplace,
}: {
  uri: string | null;
  onClose: () => void;
  onReplace?: (croppedUri: string) => void | Promise<void>;
}) {
  const [displayUri, setDisplayUri] = useState(uri);
  const [cropVisible, setCropVisible] = useState(false);
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);

  useEffect(() => {
    setDisplayUri(uri);
    scale.value = 1;
    savedScale.value = 1;
    translateX.value = 0;
    translateY.value = 0;
    savedX.value = 0;
    savedY.value = 0;
  }, [uri, savedScale, savedX, savedY, scale, translateX, translateY]);

  function requestCrop() {
    if (!onReplace) return;
    Alert.alert("裁剪图片", "裁剪完成后将替换当前图片。", [
      { text: "取消", style: "cancel" },
      { text: "开始裁剪", onPress: () => setCropVisible(true) },
    ]);
  }

  const pinch = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = Math.min(Math.max(savedScale.value * event.scale, 1), 4);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
      if (scale.value <= 1.01) {
        scale.value = withSpring(1);
        savedScale.value = 1;
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        savedX.value = 0;
        savedY.value = 0;
      }
    });

  const pan = Gesture.Pan()
    .minDistance(8)
    .onUpdate((event) => {
      if (scale.value > 1) {
        translateX.value = savedX.value + event.translationX;
        translateY.value = savedY.value + event.translationY;
      }
    })
    .onEnd(() => {
      savedX.value = translateX.value;
      savedY.value = translateY.value;
    });

  const tap = Gesture.Tap()
    .maxDuration(250)
    .onEnd((_event, success) => {
      if (success) scheduleOnRN(onClose);
    });
  const longPress = Gesture.LongPress()
    .enabled(Boolean(onReplace))
    .minDuration(550)
    .onStart(() => {
      scheduleOnRN(requestCrop);
    });
  const pressGesture = Gesture.Exclusive(longPress, tap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <>
      <Modal
        visible={Boolean(uri)}
        transparent
        animationType="fade"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={cropVisible ? () => setCropVisible(false) : onClose}
      >
        <GestureHandlerRootView style={modalStyles.backdrop}>
          {cropVisible ? (
            <ImageCropModal
              uri={displayUri}
              onCancel={() => setCropVisible(false)}
              onComplete={async (croppedUri) => {
                await onReplace?.(croppedUri);
                setDisplayUri(croppedUri);
                setCropVisible(false);
              }}
            />
          ) : displayUri ? (
            <GestureDetector
              gesture={Gesture.Simultaneous(pinch, pan, pressGesture)}
            >
              <Animated.Image
                source={{ uri: displayUri }}
                style={[modalStyles.image, animatedStyle]}
                resizeMode="contain"
              />
            </GestureDetector>
          ) : null}
        </GestureHandlerRootView>
      </Modal>
    </>
  );
}

const modalStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "#000",
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});
