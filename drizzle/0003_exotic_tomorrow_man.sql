CREATE TYPE "public"."ai_source" AS ENUM('TEXT', 'AUDIO');--> statement-breakpoint
CREATE TABLE "ai_interpretations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"project_id" uuid NOT NULL,
	"task_id" uuid,
	"source" "ai_source" DEFAULT 'TEXT' NOT NULL,
	"original_input" text NOT NULL,
	"draft_json" text NOT NULL,
	"model" text NOT NULL,
	"confidence" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_interpretations" ADD CONSTRAINT "ai_interpretations_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_interpretations" ADD CONSTRAINT "ai_interpretations_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_interpretations" ADD CONSTRAINT "ai_interpretations_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE set null ON UPDATE no action;