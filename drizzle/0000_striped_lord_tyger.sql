CREATE TABLE "account" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "product" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alias" text NOT NULL,
	"external_product_id" text NOT NULL,
	"sku" text NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"image" text,
	"usual_price" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "track" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"product_id" text NOT NULL,
	"substore_id" text NOT NULL,
	CONSTRAINT "unique_track_substore_product_user" UNIQUE("substore_id","product_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"created_at" timestamp NOT NULL,
	"pincode" text,
	"substore_id" text,
	"substore_name" text,
	"city" text,
	"address" jsonb DEFAULT '{}'::jsonb,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track" ADD CONSTRAINT "track_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "track" ADD CONSTRAINT "track_product_id_product_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."product"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "index_track_substore_product" ON "track" USING btree ("substore_id","product_id");