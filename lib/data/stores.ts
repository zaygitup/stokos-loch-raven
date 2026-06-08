export type Store = {
  slug: string;
  name: string;
  displayName: string;
  address: string;
  cityStateZip: string;
  phone: string;
  hours: string[];
  menuUrl: string;
  email: string;
  pickupTime: string;
  deliveryTime: string;
  deliveryOrderLaterOnly?: boolean;
  social: {
    facebook?: string;
    yelp?: string;
    google?: string;
  };
};

export const STORES: Store[] = [
  {
    slug: "towson",
    name: "Stoko's Towson",
    displayName: "Towson",
    address: "6821 Loch Raven Blvd",
    cityStateZip: "Loch Raven, MD 21286",
    phone: "410-296-6066",
    hours: ["Daily: 11am - 11:30pm"],
    menuUrl: "/store/towson",
    email: "support@stokos.com",
    pickupTime: "30m",
    deliveryTime: "55m",
    social: {
      facebook: "https://www.facebook.com/people/Stokos-Towson/100066667372039/",
      yelp: "https://www.yelp.com/biz/stokos-towson",
      google: "https://share.google/mFcJdRzLeeEuM8D2o",
    },
  },
  {
    slug: "york",
    name: "Stoko's York",
    displayName: "York",
    address: "5503 York Rd",
    cityStateZip: "Baltimore, MD 21212",
    phone: "410-433-4161",
    hours: ["Daily: 11am - 12am"],
    menuUrl: "/store/york",
    email: "support@stokos.com",
    pickupTime: "10m",
    deliveryTime: "35m",
    social: {
      facebook: "https://www.facebook.com/people/Stokos/100066313219435/",
      yelp: "https://www.yelp.com/biz/stokos-baltimore",
      google: "https://share.google/auEBQDz2qngc08fkJ",
    },
  },
  {
    slug: "liberty",
    name: "Stoko's Liberty",
    displayName: "Liberty",
    address: "8624 Liberty Rd",
    cityStateZip: "Randallstown, MD 21133",
    phone: "410-655-0009",
    hours: ["Sun - Thu: 10am - 10pm", "Fri - Sat: 10am - 11pm"],
    menuUrl: "/store/liberty",
    email: "support@stokos.com",
    pickupTime: "30m",
    deliveryTime: "Order Later",
    deliveryOrderLaterOnly: true,
    social: {
      google: "https://share.google/8X2nSgI5Oi6Y73Wnk",
    },
  },
];