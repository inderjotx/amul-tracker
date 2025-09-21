import { z } from "zod";
import { productService } from "@/services/product";
import { createTRPCRouter, publicProcedure, protectedProcedure } from "@/server/api/trpc";
import { mongoService } from "@/services/mongo";
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
    .query(async ({ input }) => {

      const products = await mongoService.getProducts(input.limit, input.offset);
      const totalCount = await mongoService.getTotalProducts();

      return {
        products,
        totalCount,
        hasMore: (input.offset + input.limit) < totalCount
      };
    }),

  // Get user's tracked products
  getTracked: protectedProcedure
    .query(async ({ ctx }) => {

      const trackedProducts = await mongoService.getUserAllTrackedProducts(ctx.user.id);
      return trackedProducts;
    }),

  // Track a product
  track: protectedProcedure
    .input(z.object({
      productId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      // Get user session to access substoreId

      const currentUser = await getServerSession();
      const substoreId = currentUser?.user?.substoreId;

      if (!substoreId) {
        throw new Error("User does not have a substore");
      }

      const trackingRequestId = await mongoService.trackProduct(ctx.user.id, input.productId, substoreId);
      const isNotificationSent = await productService.singleTrackNotification(substoreId, input.productId, trackingRequestId);


      if (isNotificationSent) {
        console.log("Notification sent for product", input.productId);
      } else {
        console.log("Notification not sent for product", input.productId);
      }

      return { success: true };
    }),

  // Untrack a product
  untrack: protectedProcedure
    .input(z.object({ productId: z.string() }))
    .mutation(async ({ ctx, input }) => {

      await mongoService.untrackProduct(ctx.user.id, input.productId);

      return { success: true };
    }),

  // Set user pincode and store information
  setPincode: protectedProcedure
    .input(z.object({
      pincode: z.string().length(6, "Pincode must be exactly 6 digits").regex(/^\d{6}$/, "Pincode must contain only numbers")
    }))
    .mutation(async ({ ctx, input }) => {
      await mongoService.setPincode(ctx.user.id, input.pincode);
      return { success: true };
    }),
});
