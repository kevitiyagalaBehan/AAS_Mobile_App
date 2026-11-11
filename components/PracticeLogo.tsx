import React, { useEffect, useState } from "react";
import { Image, ImageStyle, StyleProp, View, ViewStyle } from "react-native";
import { getLogoUri, getSavedPractice } from "../src/utils/practiceStorage";

const AAS_LOGO = require("../assets/aas_logo.png");

interface Props {
  style: StyleProp<ImageStyle>;
  // Applied only when a practice logo shows. Practice logos are cropped tight, unlike the
  // AAS logo file, which has empty space around it.
  practiceLogoStyle?: StyleProp<ImageStyle>;
}

// Shows the saved practice's logo, or the AAS logo when there is no saved practice,
// the practice has no logo, or the logo fails to load.
export default function PracticeLogo({ style, practiceLogoStyle }: Props) {
  const [uri, setUri] = useState<string | null>(null);
  const [label, setLabel] = useState<string>("AAS");
  const [failed, setFailed] = useState<boolean>(false);
  const [loaded, setLoaded] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;

    getSavedPractice().then((practice) => {
      if (!mounted) return;
      setUri(getLogoUri(practice));
      if (practice?.practiceName) setLabel(practice.practiceName);
      setLoaded(true);
    });

    return () => {
      mounted = false;
    };
  }, []);

  // Keeps the logo's space empty until the saved practice is read, so the AAS logo
  // doesn't flash before the practice logo.
  if (!loaded) return <View style={style as StyleProp<ViewStyle>} />;

  const showPracticeLogo = !!uri && !failed;

  return (
    <Image
      source={showPracticeLogo ? { uri } : AAS_LOGO}
      style={showPracticeLogo ? [style, practiceLogoStyle] : style}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel={showPracticeLogo ? `${label} logo` : "AAS logo"}
      onError={() => setFailed(true)}
    />
  );
}
