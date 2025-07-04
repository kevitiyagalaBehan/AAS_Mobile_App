import { useState, useEffect } from "react";
import { Dimensions } from "react-native";
import { WindowSize } from "../src/navigation/types";

type ExtendedWindowSize = WindowSize & {
  isPortrait: boolean;
};

export function useWindowSize(): ExtendedWindowSize {
  const getSize = () => {
    const { width, height } = Dimensions.get("window");
    return {
      width,
      height,
      isPortrait: height >= width,
    };
  };

  const [windowSize, setWindowSize] = useState<ExtendedWindowSize>(getSize());

  useEffect(() => {
    const updateSize = () => setWindowSize(getSize());
    const subscription = Dimensions.addEventListener("change", updateSize);
    return () => subscription.remove();
  }, []);

  return windowSize;
}
