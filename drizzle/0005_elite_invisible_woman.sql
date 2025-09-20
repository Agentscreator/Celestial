CREATE TABLE "event_media" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "event_media_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"event_id" integer NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"media_url" varchar(500) NOT NULL,
	"thumbnail_url" varchar(500),
	"title" varchar(200),
	"description" text,
	"media_type" varchar(20) NOT NULL,
	"duration" integer,
	"width" integer,
	"height" integer,
	"file_size" integer,
	"mime_type" varchar(100) NOT NULL,
	"is_public" integer DEFAULT 1 NOT NULL,
	"uploaded_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_participants" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "event_participants_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"event_id" integer NOT NULL,
	"user_id" uuid NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "event_themes" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "event_themes_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" varchar(100) NOT NULL,
	"display_name" varchar(100) NOT NULL,
	"description" text,
	"primary_color" varchar(7) NOT NULL,
	"secondary_color" varchar(7) NOT NULL,
	"accent_color" varchar(7) NOT NULL,
	"text_color" varchar(7) NOT NULL,
	"background_gradient" text,
	"font_family" varchar(100) NOT NULL,
	"font_weight" varchar(20) DEFAULT '400' NOT NULL,
	"border_radius" integer DEFAULT 8 NOT NULL,
	"shadow_intensity" varchar(20) DEFAULT 'medium' NOT NULL,
	"category" varchar(50) NOT NULL,
	"is_active" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "event_themes_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "events_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"title" varchar(200) NOT NULL,
	"description" text NOT NULL,
	"location" varchar(300) NOT NULL,
	"event_date" date NOT NULL,
	"event_time" varchar(10) NOT NULL,
	"max_participants" integer,
	"current_participants" integer DEFAULT 1 NOT NULL,
	"created_by" uuid NOT NULL,
	"share_token" varchar(64) NOT NULL,
	"is_active" integer DEFAULT 1 NOT NULL,
	"is_invite" integer DEFAULT 0 NOT NULL,
	"invite_description" text,
	"group_name" varchar(100),
	"theme_id" integer,
	"custom_flyer_url" varchar(500),
	"flyer_data" text,
	"thumbnail_video_url" varchar(500),
	"thumbnail_image_url" varchar(500),
	"custom_background_url" varchar(500),
	"custom_background_type" varchar(20),
	"is_repeating" integer DEFAULT 0 NOT NULL,
	"repeat_pattern" varchar(20),
	"repeat_interval" integer DEFAULT 1,
	"repeat_end_date" date,
	"repeat_days_of_week" varchar(20),
	"parent_event_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "events_share_token_unique" UNIQUE("share_token")
);
--> statement-breakpoint
ALTER TABLE "posts" ALTER COLUMN "content" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "post_shares" ADD COLUMN "share_token" varchar(32) NOT NULL;--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "sound_id" varchar(100);--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "sound_name" varchar(200);--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "sound_artist" varchar(200);--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "sound_preview_url" varchar(500);--> statement-breakpoint
ALTER TABLE "posts" ADD COLUMN "sound_spotify_url" varchar(500);--> statement-breakpoint
ALTER TABLE "event_media" ADD CONSTRAINT "event_media_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_media" ADD CONSTRAINT "event_media_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "event_participants" ADD CONSTRAINT "event_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_theme_id_event_themes_id_fk" FOREIGN KEY ("theme_id") REFERENCES "public"."event_themes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "post_shares" ADD CONSTRAINT "post_shares_share_token_unique" UNIQUE("share_token");