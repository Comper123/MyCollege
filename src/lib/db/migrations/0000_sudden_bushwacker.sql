CREATE TYPE "public"."userRole" AS ENUM('admin', 'laborant', 'teacher');--> statement-breakpoint
CREATE TABLE "equipmentType" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"attributesSchema" jsonb[] DEFAULT '{}',
	"createdAt" timestamp DEFAULT now(),
	CONSTRAINT "equipmentType_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"user_agent" text,
	"ip" text,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(50) NOT NULL,
	"firstname" varchar(50) NOT NULL,
	"lastname" varchar(50) NOT NULL,
	"fathername" varchar(50),
	"role" "userRole" DEFAULT 'teacher' NOT NULL,
	"passwordHash" text NOT NULL,
	"passwordShifr" text NOT NULL,
	"is_active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rooms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"number" varchar(6) NOT NULL,
	"description" text,
	"attached_lab_id" uuid,
	"attached_teacher_id" uuid,
	CONSTRAINT "rooms_number_unique" UNIQUE("number")
);
--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_attached_lab_id_users_id_fk" FOREIGN KEY ("attached_lab_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_attached_teacher_id_users_id_fk" FOREIGN KEY ("attached_teacher_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;