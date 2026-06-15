// Run in MongoDB shell / Compass for faster menu queries.
// Collection names may need adjustment if your database uses different names.

db.productstoreconfigs.createIndex({ storeId: 1, status: 1, sortOrder: 1 });
db.productstoreconfigs.createIndex({ productId: 1 });
db.productstoreconfigs.createIndex({ storeId: 1, productId: 1, status: 1 });
db.products.createIndex({ status: 1, _id: 1 });
db.products.createIndex({ id: 1, status: 1 });
db.products.createIndex({ slug: 1, status: 1 });
db.stores.createIndex({ slug: 1, status: 1 });
db.modifiergroups.createIndex({ id: 1, status: 1 });
db.modifiergroups.createIndex({ modifierGroupId: 1, status: 1 });
db.modifiergroups.createIndex({ slug: 1, status: 1 });
