import { z } from "zod";
import { eq, and, sql } from "drizzle-orm";

import { createTRPCRouter, publicProcedure, protectedProcedure } from "@/server/api/trpc";
import { product, track, user } from "@/server/db/schema";
import { storeService } from "@/services/store";
import { getServerSession } from "@/auth/utils";

export const productsRouter = createTRPCRouter({
  // Get all products (public)

  getUserSession: publicProcedure.query(async () => {
    const session = await getServerSession();
    return session;
  }),

  getAll: publicProcedure
    .input(z.object({
      limit: z.number().min(1).max(30).default(30),
      offset: z.number().min(0).default(0)
    }))
    .query(async ({ ctx, input }) => {
      const products = await ctx.db
        .select()
        .from(product)
        .limit(input.limit)
        .offset(input.offset);

      // Get total count for pagination
      const totalCount = await ctx.db
        .select({ count: sql<number>`count(*)` })
        .from(product);

      return {
        products,
        totalCount: totalCount[0]?.count ?? 0,
        hasMore: (input.offset + input.limit) < (totalCount[0]?.count ?? 0)
      };
    }),

  // Get user's tracked products
  getTracked: protectedProcedure
    .query(async ({ ctx }) => {
      const trackedProducts = await ctx.db
        .select({
          id: product.id,
          alias: product.alias,
          name: product.name,
          description: product.description,
          image: product.image,
          usualPrice: product.usualPrice,
          sku: product.sku,
          trackId: track.id,
        })
        .from(track)
        .innerJoin(product, eq(track.productId, product.id))
        .where(eq(track.userId, ctx.user.id));

      return trackedProducts;
    }),

  // Track a product
  track: protectedProcedure
    .input(z.object({
      productId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {

      // Check if already tracked

      const currentUser = await ctx.db
        .select()
        .from(user)
        .where(eq(user.id, ctx.user.id));

      if (!currentUser?.[0]?.substoreId) {
        throw new Error("User does not have a substore");
      }

      const existingTrack = await ctx.db
        .select()
        .from(track)
        .where(
          and(
            eq(track.userId, ctx.user.id),
            eq(track.productId, input.productId),
            eq(track.substoreId, currentUser?.[0]?.substoreId)
          )
        )
        .limit(1);

      if (existingTrack.length > 0) {
        throw new Error("Product is already being tracked");
      }

      // Create new track entry
      const newTrack = await ctx.db
        .insert(track)
        .values({
          userId: ctx.user.id,
          productId: input.productId,
          substoreId: currentUser?.[0]?.substoreId,
        })
        .returning();

      return newTrack[0];
    }),

  // Untrack a product
  untrack: protectedProcedure
    .input(z.object({ trackId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const deletedTrack = await ctx.db
        .delete(track)
        .where(
          and(
            eq(track.id, input.trackId),
            eq(track.userId, ctx.user.id)
          )
        )
        .returning();

      if (deletedTrack.length === 0) {
        throw new Error("Track entry not found or not authorized");
      }

      return { success: true };
    }),

  // Check if a product is tracked by user
  isTracked: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .query(async ({ ctx, input }) => {
      const existingTrack = await ctx.db
        .select()
        .from(track)
        .where(
          and(
            eq(track.userId, ctx.user.id),
            eq(track.productId, input.productId)
          )
        )
        .limit(1);

      return {
        isTracked: existingTrack.length > 0,
        trackId: existingTrack[0]?.id ?? null,
      };
    }),

  // Set user pincode and store information
  setPincode: protectedProcedure
    .input(z.object({
      pincode: z.string().length(6, "Pincode must be exactly 6 digits").regex(/^\d{6}$/, "Pincode must contain only numbers")
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        // Get store information using the store service
        const storeResult = await storeService.getStoreId(input.pincode);

        if (!storeResult?.subStoreId) {
          throw new Error("Unable to find stores for this pincode. Please try a different pincode.");
        }

        const { subStoreId, subStoreName } = storeResult;

        // Update user with pincode and store information
        await ctx.db
          .update(user)
          .set({
            pincode: input.pincode,
            substoreId: subStoreId,
            substoreName: subStoreName,
            updatedAt: new Date(),
          })
          .where(eq(user.id, ctx.user.id));

        return {
          success: true,
          data: {
            pincode: input.pincode,
            substoreId: subStoreId,
            substoreName: subStoreName
          }
        };

      } catch (error) {
        console.error("Error setting pincode:", error);
        throw new Error(
          error instanceof Error
            ? error.message
            : "An error occurred while setting your location. Please try again."
        );
      }
    }),
});
