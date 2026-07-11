"use client";

import React from "react";
import { QuestionData } from "@/app/(dashboard)/teacher/quizzes/[quizId]/questions/page";
import { QuestionCardItem } from "./QuestionCardItem";

export interface QuestionListProps {
  questions: QuestionData[];
  durationMode?: string;
  onAddFirst: () => void;
  onMoveQuestion: (index: number, direction: "up" | "down") => void;
  onEditQuestion: (question: QuestionData) => void;
  onDeleteQuestion: (question: QuestionData) => void;
}

export const QuestionList: React.FC<QuestionListProps> = ({
  questions,
  durationMode = "global",
  onAddFirst,
  onMoveQuestion,
  onEditQuestion,
  onDeleteQuestion,
}) => {
  return (
    <section>
      {questions.length === 0 ? (
        /* Empty State Card */
        <div className="card py-18 px-8 text-center border-2 border-dashed border-border bg-secondary rounded-2xl shadow-lg">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            No questions added yet
          </h2>
          <p className="text-muted-foreground max-w-[480px] mx-auto mb-8 text-base leading-relaxed">
            Start building your interactive assessment by adding multiple
            choice, true/false, or essay questions.
          </p>
          <button onClick={onAddFirst} className="btn btn-primary btn-lg font-bold shadow-lg shadow-primary/30">
            Add Your First Question
          </button>
        </div>
      ) : (
        /* Populated Questions List */
        <div className="flex flex-col gap-6">
          {questions.map((q, idx) => (
            <QuestionCardItem
              key={q.id}
              question={q}
              index={idx}
              isFirst={idx === 0}
              isLast={idx === questions.length - 1}
              durationMode={durationMode}
              onMoveUp={() => onMoveQuestion(idx, "up")}
              onMoveDown={() => onMoveQuestion(idx, "down")}
              onEdit={() => onEditQuestion(q)}
              onDelete={() => onDeleteQuestion(q)}
            />
          ))}
        </div>
      )}
    </section>
  );
};
