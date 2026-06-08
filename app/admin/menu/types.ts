export type TabType = "products" | "categories" | "modifiers" | "upsells";

export type ProductStatus = "Active" | "Draft" | "Hidden";
export type CategoryStatus = "Active" | "Hidden";
export type UpsellStatus = "Active" | "Paused" | "Inactive";
export type StoreStatus = "Active" | "Inactive";

export type OrderType = "pickup" | "delivery" | "both";

export type StoreAddress = {
  street: string;
  city: string;
  state: string;
  zip: string;
};

export type StoreHours = {
  day: string;
  open: string;
  close: string;
  closed: boolean;
};

export type Store = {
  _id?: string;
  id?: string;

  name: string;
  slug: string;

  phone?: string;
  email?: string;
  hngrUrl?: string;

  address?: StoreAddress;

  status: StoreStatus;

  orderType?: OrderType;
  pickupEnabled?: boolean;
  deliveryEnabled?: boolean;

  deliveryFee?: number;
  minimumOrder?: number;
  taxRate?: number;

  hours?: StoreHours[];

  updatedAt?: string;
};

export type ModifierOption = {
  id?: string;
  name: string;
  status?: "Active" | "Inactive";
};

export type ModifierGroupAssignment = {
  _id?: string;
  id?: string;

  modifierGroupId?: string;

  storeId: string;

  categoryId: string;
  categoryName: string;

  sortOrder?: number;
  status?: "Active" | "Inactive";

  updatedAt?: string;
};

export type ProductSize = {
  id?: string;
  name: string;
  price: number;
  sortOrder?: number;
};

export type ProductModifierOption = {
  id?: string;
  optionId?: string;
  name: string;
  status?: "Active" | "Inactive";
  pricesBySize: Record<string, number>;
};

export type ProductModifierGroup = {
  modifierGroupId?: string;
  name: string;
  required?: boolean;
  minSelect?: number;
  maxSelect?: number;
  sortOrder?: number;
  status?: "Active" | "Inactive";
  options: ProductModifierOption[];
};

export type Product = {
  _id?: string;
  id: string;

  storeId: string;

  name: string;

  category: string;
  categoryId?: string;
  categoryName?: string;

  price: number;
  sizes?: ProductSize[];

  image: string;

  status: ProductStatus;

  // Product-level modifier snapshot with per-size override prices.
  modifierGroups: ProductModifierGroup[];
  modifierGroupIds?: string[];

  upsell: string;
  relatedUpsells?: string[];

  description?: string;
  sortOrder?: number;

  updatedAt: string;
};

export type Category = {
  _id?: string;
  id?: string;

  storeId: string;

  name: string;
  slug?: string;
  description?: string;
  image?: string;

  sortOrder: number;
  status: CategoryStatus;

  updatedAt?: string;
};

export type ModifierGroup = {
  _id?: string;
  id?: string;

  name: string;
  slug?: string;

  // Global options only. Prices stay on product/product-size level.
  options: ModifierOption[];

  required: boolean;
  minSelect?: number;
  maxSelect?: number;

  sortOrder?: number;
  status?: "Active" | "Inactive";

  // Link rows that control where this global group appears.
  assignments?: ModifierGroupAssignment[];

  // Legacy support only.
  // Do not use these for new modifier logic.
  storeId?: string;
  appliesTo?: string;
  appliesToCategories?: string[];
  category?: string;
  categoryId?: string;
  categoryName?: string;

  updatedAt?: string;
};

export type UpsellRule = {
  _id?: string;
  id?: string;

  storeId: string;

  name?: string;
  slug?: string;

  triggerCategoryId: string;
  triggerCategoryName: string;

  offerProductIds: string[];

  trigger?: string;
  offer?: string;
  image?: string;

  appliesToCategories?: string[];
  appliesToProducts?: string[];

  sortOrder?: number;
  status: UpsellStatus;

  updatedAt?: string;
};