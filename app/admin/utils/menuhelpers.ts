type MongoItem = {
  _id?: string;
  id?: string;
  name?: string;
  slug?: string;
  offer?: string;
};

export const getSafeId = (item: unknown, fallback: string) => {
  if (typeof item === "object" && item !== null) {
    const obj = item as MongoItem;

    return String(
      obj._id || obj.id || obj.slug || obj.name || obj.offer || fallback
    );
  }

  return fallback;
};

export const getTextValue = (value: unknown, fallback = "") => {
  if (!value) return fallback;

  if (typeof value === "string") return value;

  if (typeof value === "number") return String(value);

  if (typeof value === "object") {
    const obj = value as MongoItem;

    return obj.name || obj.offer || obj.slug || fallback;
  }

  return fallback;
};

export const normalizeStringArray = (values: unknown) => {
  if (!Array.isArray(values)) return [];

  return values
    .map((item) => getTextValue(item, ""))
    .filter((item): item is string => Boolean(item));
};

export function getMenuModalLabel(type: string) {
  if (type === "products") return "Product";
  if (type === "categories") return "Category";
  if (type === "modifiers") return "Modifier Group";
  if (type === "upsells") return "Upsell";

  return "Item";
}