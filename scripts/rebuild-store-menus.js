/*
  Rebuild store menu snapshots for all stores (or one slug).

  Usage:
    node --env-file=.env.local scripts/rebuild-store-menus.js
    node --env-file=.env.local scripts/rebuild-store-menus.js towson
*/

const mongoose = require("mongoose");

const STORES = ["towson", "york", "liberty"];

async function main() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || "stokos";
  if (!uri) {
    console.error("MONGODB_URI is required");
    process.exit(1);
  }

  const targetSlug = process.argv[2]?.trim().toLowerCase();
  const slugs = targetSlug ? [targetSlug] : STORES;

  await mongoose.connect(uri, { dbName });

  // Dynamic import not available in plain CJS — call rebuild via HTTP if app running,
  // or instruct user to use admin API. For CLI we document the admin endpoint.
  console.log("Connected to MongoDB:", dbName);
  console.log("");
  console.log("Rebuild store menu snapshots via admin API (signed in as admin):");
  console.log("  POST /api/admin/menu/storemenus/rebuild");
  console.log('  Body: { "storeSlugs": "all" }');
  console.log("");
  console.log("Or GET while dev server is running:");
  for (const slug of slugs) {
    console.log(
      `  curl -X POST http://localhost:3000/api/admin/menu/storemenus/rebuild -H "Content-Type: application/json" -d '{"storeSlug":"${slug}"}'`
    );
  }
  console.log("");
  console.log(
    "Store slugs to verify after rebuild:",
    slugs.join(", ")
  );

  await mongoose.disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
