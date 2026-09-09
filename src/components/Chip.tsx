import { Pressable, Text } from "react-native";
import { styles } from "../styles";

export function Chip({
  text,
  selected,
  onPress,
}: {
  text: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.chip, selected && styles.chipActive]}
    >
      <Text style={[styles.chipText, selected && styles.chipTextActive]}>
        {text}
      </Text>
    </Pressable>
  );
}
