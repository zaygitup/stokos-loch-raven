# Abassi — MongoDB Production Checklist

**Owner:** Abassi  
**Handoff to:** Azan (Vercel `MONGODB_URI` + `MONGODB_DB`)

Stokos does **not** need Atlas access.

---

## 1. Document current state (Hamid cluster)

- [ ] Record cluster hostname, database name (`stokos`), and collection counts
- [ ] Confirm stores: `towson`, `york`, `liberty` with `status: Active`
- [ ] Confirm menu data: `products`, `productstoreconfigs`, `categories`, `categorystoreconfigs`

```bash
node --env-file=.env.local -e "
const { MongoClient } = require('mongodb');
(async () => {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || 'stokos');
  for (const c of ['stores','products','productstoreconfigs','categories','orders']) {
    console.log(c + ':', await db.collection(c).countDocuments());
  }
  await client.close();
})();
"
```

---

## 2. Provision production Atlas cluster

- [ ] Create **M10+** cluster (e.g. `stokos-prod`) near Vercel region (`us-east-1`)
- [ ] Enable **Continuous Cloud Backup**
- [ ] Create DB user `stokos_app` (readWrite on `stokos` only)
- [ ] Network Access: allow Vercel (document IP strategy)

---

## 3. Migrate data

```bash
mongodump --uri="$SOURCE_URI" --db=stokos --out=./mongo-backup
mongorestore --uri="$PROD_URI" --db=stokos --drop ./mongo-backup/stokos
```

- [ ] Verify collection counts match source
- [ ] Spot-check menu on staging app after Azan updates Preview env

---

## 4. Indexes

```bash
node --env-file=.env.production scripts/mongodb-indexes.js
```

Orders search index:

```js
db.orders.createIndex({
  orderNumber: "text",
  customerName: "text",
  customerEmail: "text",
});
```

- [ ] Index script completed without errors
- [ ] Orders text index created

---

## 5. Handoff to Azan

Deliver via password manager:

```
MONGODB_URI=mongodb+srv://...
MONGODB_DB=stokos
```

---

## Monthly maintenance

- Monitor Atlas alerts (CPU, connections, disk)
- Optional: quarterly backup restore test
- Re-run index script after major menu migrations if admin APIs report duplicate key errors
