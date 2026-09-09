import { Outfit } from "../types";
import { OutfitCanvas } from "./OutfitCanvas";

export function OutfitThumb({ outfit }: { outfit: Outfit }) {
  return <OutfitCanvas outfit={outfit} compact />;
}
