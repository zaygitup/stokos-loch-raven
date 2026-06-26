import { NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@clerk/nextjs/server";
import connectMongoDB from "@/lib/mongodb";
import Order from "@/models/order";
import Store from "@/models/store";
import { validatePromoCode, incrementPromoUsage } from "@/lib/promo";
import { awardLoyaltyPoints } from "@/lib/loyalty";
import { toCents, toDollars, percentOfCents, formatCents } from "@/lib/money";
import { isWithinRadius } from "@/lib/geo";

function getStripe() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

function buildConnectPaymentIntentData(amountTotalCents: number) {
  const connectAccountId = process.env.STRIPE_CONNECT_ACCOUNT_ID?.trim();
  if (!connectAccountId) return undefined;

  const feePercent = Number(process.env.STRIPE_PLATFORM_FEE_PERCENT ?? 0);
  const feeAmount = percentOfCents(amountTotalCents, feePercent);

  return {
    application_fee_amount: feeAmount,
    transfer_data: {
      destination: connectAccountId,
    },
  };
}

function generateOrderNumber(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `STK-${code}`;
}

// CREATE STRIPE CHECKOUT
export async function POST(req: Request) {
  try {
    const {
      items,
      slug,
      orderType,
      deliveryAddress,
      deliveryLat,
      deliveryLng,
      orderDay,
      orderTime,
      orderStore,
      promoCode,
    } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    if (!orderType) {
      return NextResponse.json(
        { error: "Order type is required" },
        { status: 400 }
      );
    }

    if (orderType === "delivery" && !deliveryAddress) {
      return NextResponse.json(
        { error: "Delivery address is required" },
        { status: 400 }
      );
    }

    const origin =
      req.headers.get("origin") ||
      process.env.NEXT_PUBLIC_BASE_URL ||
      "http://localhost:3000";

    const stripe = getStripe();
    const cleanOrigin = origin.replace(/\/$/, "");
    const storeSlug = String(slug || orderStore || "").trim();
    const formattedDay = orderDay || "Today";
    const formattedTime = orderTime || "ASAP";

    if (!storeSlug) {
      return NextResponse.json(
        { error: "Store is required" },
        { status: 400 }
      );
    }

    // Fetch store for delivery fee, tax, minimum order
    await connectMongoDB();

    const storeDoc = await Store.findOne({ slug: storeSlug }).lean() as {
      name: string;
      deliveryFee?: number;
      taxRate?: number;
      minimumOrder?: number;
      latitude?: number | null;
      longitude?: number | null;
      deliveryRadiusKm?: number;
    } | null;

    if (!storeDoc) {
      return NextResponse.json(
        { error: "Store not found" },
        { status: 404 }
      );
    }

    const storeName = storeDoc.name || storeSlug;

    // Re-validate the delivery point against the service area. Only enforced
    // when the branch has a configured pin — legacy stores without coords fall
    // back to the address-only check above.
    const parsedDeliveryLat = Number(deliveryLat);
    const parsedDeliveryLng = Number(deliveryLng);

    if (
      orderType === "delivery" &&
      storeDoc.latitude != null &&
      storeDoc.longitude != null
    ) {
      if (
        !Number.isFinite(parsedDeliveryLat) ||
        !Number.isFinite(parsedDeliveryLng)
      ) {
        return NextResponse.json(
          { error: "Please select your delivery location on the map." },
          { status: 400 }
        );
      }

      const within = isWithinRadius(
        { lat: storeDoc.latitude, lng: storeDoc.longitude },
        { lat: parsedDeliveryLat, lng: parsedDeliveryLng },
        Number(storeDoc.deliveryRadiusKm ?? 8)
      );

      if (!within) {
        return NextResponse.json(
          { error: "Delivery address is outside the delivery area." },
          { status: 400 }
        );
      }
    }
    const taxRate = Number(storeDoc.taxRate ?? 0);

    // All money math is done in integer cents (see lib/money.ts) so the
    // persisted total always matches the sum Stripe charges per line item.
    const deliveryFeeCents =
      orderType === "delivery" ? toCents(storeDoc.deliveryFee ?? 0) : 0;
    const minimumOrderCents = toCents(storeDoc.minimumOrder ?? 0);

    const subtotalCents = items.reduce(
      (acc: number, item: { price: number; quantity: number }) =>
        acc + toCents(item.price) * Number(item.quantity || 1),
      0
    );

    if (minimumOrderCents > 0 && subtotalCents < minimumOrderCents) {
      return NextResponse.json(
        {
          error: `Minimum order amount is ${formatCents(minimumOrderCents)}. Your subtotal is ${formatCents(subtotalCents)}.`,
        },
        { status: 400 }
      );
    }

    const taxCents = percentOfCents(subtotalCents, taxRate);

    let discountCents = 0;
    let appliedPromoCode: string | undefined;

    if (promoCode) {
      const promoResult = await validatePromoCode(
        String(promoCode),
        toDollars(subtotalCents)
      );
      if (!promoResult.valid) {
        return NextResponse.json({ error: promoResult.message }, { status: 400 });
      }
      discountCents = toCents(promoResult.discountAmount);
      appliedPromoCode = promoResult.code;
    }

    const amountTotalCents =
      subtotalCents + deliveryFeeCents + taxCents - discountCents;

    if (amountTotalCents <= 0) {
      return NextResponse.json(
        { error: "Order total must be greater than zero" },
        { status: 400 }
      );
    }

    // Dollar values for persistence, derived from the authoritative cents.
    const subtotal = toDollars(subtotalCents);
    const deliveryFee = toDollars(deliveryFeeCents);
    const taxAmount = toDollars(taxCents);
    const discountAmount = toDollars(discountCents);
    const amountTotal = toDollars(amountTotalCents);

    const { userId: clerkUserId } = await auth();

    // Build Stripe line items
    const lineItems = items.map(
      (item: {
        title: string;
        price: number;
        quantity: number;
        size?: { label?: string };
        toppings?: Record<string, string>;
        sauces?: string[];
        note?: string;
      }) => {
        const descriptionParts: string[] = [];

        if (item.size?.label) {
          descriptionParts.push(`Size: ${item.size.label}`);
        }

        if (item.toppings && Object.keys(item.toppings).length > 0) {
          descriptionParts.push(
            `Toppings: ${Object.entries(item.toppings)
              .map(([name, side]) => `${name} (${side})`)
              .join(", ")}`
          );
        }

        if (item.sauces && item.sauces.length > 0) {
          descriptionParts.push(`Sauces: ${item.sauces.join(", ")}`);
        }

        if (item.note) {
          descriptionParts.push(`Note: ${item.note}`);
        }

        return {
          price_data: {
            currency: "usd",
            product_data: {
              name: item.title,
              description: descriptionParts.length
                ? descriptionParts.join(" | ")
                : undefined,
            },
            unit_amount: toCents(item.price),
          },
          quantity: item.quantity || 1,
        };
      }
    );

    const extraLineItems = [];

    if (deliveryFeeCents > 0) {
      extraLineItems.push({
        price_data: {
          currency: "usd",
          product_data: { name: "Delivery Fee" },
          unit_amount: deliveryFeeCents,
        },
        quantity: 1,
      });
    }

    if (taxCents > 0) {
      extraLineItems.push({
        price_data: {
          currency: "usd",
          product_data: { name: `Tax (${taxRate}%)` },
          unit_amount: taxCents,
        },
        quantity: 1,
      });
    }

    if (discountCents > 0) {
      extraLineItems.push({
        price_data: {
          currency: "usd",
          product_data: { name: `Promo (${appliedPromoCode})` },
          unit_amount: -discountCents,
        },
        quantity: 1,
      });
    }

    const allLineItems = [...lineItems, ...extraLineItems];

    // Generate unique order number
    let orderNumber = generateOrderNumber();
    let attempts = 0;
    while (attempts < 5) {
      const exists = await Order.exists({ orderNumber });
      if (!exists) break;
      orderNumber = generateOrderNumber();
      attempts++;
    }

    // Persist order as Placed/pending before Stripe session
    const orderItems = items.map(
      (item: {
        title?: string;
        name?: string;
        price: number;
        quantity: number;
        size?: { label?: string; price?: number };
        toppings?: Record<string, string>;
        sauces?: string[];
        note?: string;
      }) => ({
        name: item.title || item.name || "Item",
        quantity: Number(item.quantity || 1),
        unitPrice: toDollars(toCents(item.price)),
        amount: toDollars(toCents(item.price) * Number(item.quantity || 1)),
        size: item.size,
        toppings: item.toppings
          ? Object.fromEntries(Object.entries(item.toppings))
          : undefined,
        sauces: item.sauces,
        note: item.note,
      })
    );

    // Create the order in MongoDB
    const newOrder = await Order.create({
      orderNumber,
      stripeSessionId: "pending_" + orderNumber,
      storeSlug,
      storeName,
      orderType,
      deliveryAddress: deliveryAddress || "",
      deliveryLat:
        orderType === "delivery" && Number.isFinite(parsedDeliveryLat)
          ? parsedDeliveryLat
          : undefined,
      deliveryLng:
        orderType === "delivery" && Number.isFinite(parsedDeliveryLng)
          ? parsedDeliveryLng
          : undefined,
      orderDay: formattedDay,
      orderTime: formattedTime,
      clerkUserId: clerkUserId || undefined,
      promoCode: appliedPromoCode,
      discountAmount,
      items: orderItems,
      subtotal,
      deliveryFee,
      tax: taxAmount,
      amountTotal,
      currency: "USD",
      paymentStatus: "pending",
      status: "Placed",
      statusHistory: [{ status: "Placed", at: new Date() }],
    });

    const connectPaymentIntentData = buildConnectPaymentIntentData(amountTotalCents);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",

      adaptive_pricing: {
        enabled: false,
      },

      payment_method_types: ["card"],

      line_items: allLineItems,

      ...(connectPaymentIntentData
        ? { payment_intent_data: connectPaymentIntentData }
        : {}),

      metadata: {
        store: storeSlug,
        orderStore: orderStore || storeSlug,
        orderType,
        deliveryAddress: deliveryAddress || "",
        orderDay: formattedDay,
        orderTime: formattedTime,
        orderId: String(newOrder._id),
        orderNumber,
      },

      success_url: `${cleanOrigin}/store/${storeSlug}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${cleanOrigin}/store/${storeSlug}?payment=cancelled`,
    });

    // Update order with real Stripe session ID
    await Order.findByIdAndUpdate(newOrder._id, {
      stripeSessionId: session.id,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("STRIPE ERROR:", error);

    return NextResponse.json(
      { error: "Stripe checkout failed" },
      { status: 500 }
    );
  }
}

// GET STRIPE SESSION DETAILS FOR SUCCESS PAGE
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("session_id");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    const stripe = getStripe();

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    const lineItems = await stripe.checkout.sessions.listLineItems(sessionId, {
      limit: 50,
    });

    // Fallback: if webhook hasn't fired yet, mark paid now
    if (session.payment_status === "paid") {
      await connectMongoDB();

      await Order.findOneAndUpdate(
        { stripeSessionId: sessionId, paymentStatus: { $ne: "paid" } },
        {
          $set: {
            paymentStatus: "paid",
            status: "Confirmed",
            customerName: session.customer_details?.name || "Not provided",
            customerEmail: session.customer_details?.email || "Not provided",
          },
          $push: {
            statusHistory: { status: "Confirmed", at: new Date() },
          },
        }
      );
    }

    return NextResponse.json({
      id: session.id,
      paymentStatus: session.payment_status,
      amountTotal: session.amount_total ? session.amount_total / 100 : 0,
      currency: session.currency?.toUpperCase() || "USD",
      customerName: session.customer_details?.name || "Not provided",
      customerEmail: session.customer_details?.email || "Not provided",
      metadata: session.metadata || {},
      items: lineItems.data.map((item) => ({
        name: item.description || "Item",
        quantity: item.quantity || 1,
        amount: item.amount_total ? item.amount_total / 100 : 0,
        currency: item.currency?.toUpperCase() || "USD",
      })),
    });
  } catch (error) {
    console.error("CHECKOUT SESSION ERROR:", error);

    return NextResponse.json(
      { error: "Failed to fetch checkout session" },
      { status: 500 }
    );
  }
}
