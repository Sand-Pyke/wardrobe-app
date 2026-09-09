import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { WardrobeNavigator } from "./src/navigation/WardrobeNavigator";
import { styles } from "./src/styles";

export default function App() {
  return (
    <GestureHandlerRootView style={styles.gestureRoot}>
      <SafeAreaProvider>
        <WardrobeNavigator />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
