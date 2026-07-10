ALTER TABLE "participants" DROP CONSTRAINT "participants_quiz_id_quizzes_id_fk";
--> statement-breakpoint
ALTER TABLE "quiz_attempts" DROP CONSTRAINT "quiz_attempts_quiz_id_quizzes_id_fk";
--> statement-breakpoint
ALTER TABLE "quiz_attempts" DROP CONSTRAINT "quiz_attempts_user_id_users_id_fk";
--> statement-breakpoint
ALTER TABLE "quiz_attempts" DROP CONSTRAINT "quiz_attempts_participant_id_participants_id_fk";
--> statement-breakpoint
ALTER TABLE "student_answers" DROP CONSTRAINT "student_answers_question_id_questions_id_fk";
--> statement-breakpoint
ALTER TABLE "student_answers" DROP CONSTRAINT "student_answers_selected_option_id_question_options_id_fk";
--> statement-breakpoint
ALTER TABLE "quizzes" ADD COLUMN "certificate_signer_name" varchar(255);--> statement-breakpoint
ALTER TABLE "quizzes" ADD COLUMN "certificate_signer_role" varchar(255);--> statement-breakpoint
ALTER TABLE "quizzes" ADD COLUMN "certificate_signature_url" varchar(1024);--> statement-breakpoint
ALTER TABLE "participants" ADD CONSTRAINT "participants_quiz_id_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_quiz_id_quizzes_id_fk" FOREIGN KEY ("quiz_id") REFERENCES "public"."quizzes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_participant_id_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."participants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_answers" ADD CONSTRAINT "student_answers_question_id_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_answers" ADD CONSTRAINT "student_answers_selected_option_id_question_options_id_fk" FOREIGN KEY ("selected_option_id") REFERENCES "public"."question_options"("id") ON DELETE set null ON UPDATE no action;