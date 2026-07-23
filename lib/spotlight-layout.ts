import type {
  SpotlightLayout,
  SpotlightPlacement,
  SpotlightShape,
} from "@/lib/types";

export const spotlightShapes: {
  value: SpotlightShape;
  label: string;
}[] = [
  { value: "portrait", label: "Portrait" },
  { value: "landscape", label: "Landscape" },
  { value: "square", label: "Square" },
  { value: "circle", label: "Circle" },
  { value: "polaroid", label: "Polaroid" },
];

const desktopPresets: SpotlightPlacement[] = [
  { x: 2, y: 7, width: 18, rotation: -7, shape: "portrait" },
  { x: 20, y: 3, width: 21, rotation: 6, shape: "landscape" },
  { x: 70, y: 4, width: 17, rotation: -5, shape: "portrait" },
  { x: 84, y: 17, width: 16, rotation: 7, shape: "square" },
  { x: 4, y: 66, width: 18, rotation: -8, shape: "landscape" },
  { x: 24, y: 74, width: 15, rotation: 4, shape: "polaroid" },
  { x: 64, y: 72, width: 18, rotation: 5, shape: "landscape" },
  { x: 83, y: 68, width: 15, rotation: -6, shape: "portrait" },
  { x: 7, y: 35, width: 13, rotation: 4, shape: "square" },
  { x: 78, y: 40, width: 14, rotation: -4, shape: "circle" },
];

const mobilePresets: SpotlightPlacement[] = [
  { x: 4, y: 4, width: 40, rotation: -7, shape: "portrait" },
  { x: 59, y: 7, width: 36, rotation: 7, shape: "landscape" },
  { x: 3, y: 67, width: 38, rotation: 6, shape: "square" },
  { x: 61, y: 68, width: 35, rotation: -6, shape: "portrait" },
  { x: 2, y: 34, width: 28, rotation: 5, shape: "circle" },
  { x: 72, y: 37, width: 27, rotation: -5, shape: "polaroid" },
  { x: 34, y: 80, width: 33, rotation: 3, shape: "landscape" },
  { x: 34, y: 1, width: 31, rotation: -3, shape: "square" },
];

export function defaultSpotlightLayout(index: number): SpotlightLayout {
  return {
    desktop: { ...desktopPresets[index % desktopPresets.length] },
    mobile: { ...mobilePresets[index % mobilePresets.length] },
  };
}

function placement(value: unknown, fallback: SpotlightPlacement): SpotlightPlacement {
  if (!value || typeof value !== "object") return fallback;
  const input = value as Partial<SpotlightPlacement>;
  const validShape = spotlightShapes.some((shape) => shape.value === input.shape);

  return {
    x: typeof input.x === "number" ? input.x : fallback.x,
    y: typeof input.y === "number" ? input.y : fallback.y,
    width: typeof input.width === "number" ? input.width : fallback.width,
    rotation: typeof input.rotation === "number" ? input.rotation : fallback.rotation,
    shape: validShape ? (input.shape as SpotlightShape) : fallback.shape,
  };
}

export function normalizeSpotlightLayout(value: unknown, index: number): SpotlightLayout {
  const fallback = defaultSpotlightLayout(index);
  if (!value || typeof value !== "object") return fallback;
  const input = value as Partial<SpotlightLayout>;

  return {
    desktop: placement(input.desktop, fallback.desktop),
    mobile: placement(input.mobile, fallback.mobile),
  };
}
