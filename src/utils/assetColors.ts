const assetClassColors: { [key: string]: string } = {
  Cash: "#5DA8A7",
  "Aust. Equities": "#7AC2E1",
  "Int. Equities": "#677EB5",
  Property: "#A46E7E",
  Other: "#EDBE72",
};

export const getColorForAssetClass = (assetClass: string) =>
  assetClassColors[assetClass] || "#999";
