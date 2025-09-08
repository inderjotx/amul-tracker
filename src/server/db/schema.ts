import { relations, sql } from "drizzle-orm";
import { pgTable, text, timestamp, boolean, pgEnum, jsonb, index, unique, integer } from "drizzle-orm/pg-core";

export const user = pgTable("user", {
    id: text("id").primaryKey().default(sql`gen_random_uuid()`),
    name: text("name").notNull(),
    email: text("email").notNull().unique(),
    emailVerified: boolean("email_verified")
        .$defaultFn(() => false)
        .notNull(),
    image: text("image"),
    createdAt: timestamp("created_at")
        .$defaultFn(() => /* @__PURE__ */ new Date())
        .notNull(),
    pincode: text("pincode"),
    substoreId: text("substore_id"),
    substoreName: text("substore_name"),
    city: text("city"),
    address: jsonb("address").default({}),
    updatedAt: timestamp("updated_at")
        .$defaultFn(() => /* @__PURE__ */ new Date())
        .notNull(),
});

export const session = pgTable("session", {
    id: text("id").primaryKey().default(sql`gen_random_uuid()`),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
    id: text("id").primaryKey().default(sql`gen_random_uuid()`),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").notNull(),
    updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
    id: text("id").primaryKey().default(sql`gen_random_uuid()`),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").$defaultFn(
        () => /* @__PURE__ */ new Date(),
    ),
    updatedAt: timestamp("updated_at").$defaultFn(
        () => /* @__PURE__ */ new Date(),
    ),
});


export const product = pgTable("product", {
    id: text("id").primaryKey().notNull(),
    alias: text("alias").notNull(),
    // "external_product_id": text("external_product_id").notNull(),
    sku: text("sku").notNull(),
    name: text("name").notNull(),
    description: text("description"),
    image: text("image"),
    usualPrice: integer("usual_price").notNull(),
});


export const track = pgTable("track", {
    id: text("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    productId: text("product_id").notNull().references(() => product.id, { onDelete: "cascade" }),
    substoreId: text("substore_id").notNull(),
}, (table) => [
    index("index_track_substore_product").on(table.substoreId, table.productId),
    unique("unique_track_substore_product_user").on(table.substoreId, table.productId, table.userId),
]);


export const productRelations = relations(product, ({ many }) => ({
    tracks: many(track),
}));


export const trackRelations = relations(track, ({ one }) => ({
    user: one(user, {
        fields: [track.userId],
        references: [user.id],
    }),
    product: one(product, {
        fields: [track.productId],
        references: [product.id],
    }),
}));


export const userRelations = relations(user, ({ many }) => ({
    tracks: many(track),
}));