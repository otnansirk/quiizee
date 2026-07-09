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
        <div
          className="card"
          style={{
            padding: "4.5rem 2rem",
            textAlign: "center",
            border: "2px dashed var(--border)",
            background: "var(--bg-secondary)",
          }}
        >
          <h2
            style={{
              fontSize: "1.5rem",
              fontWeight: 700,
              color: "var(--text-primary)",
              marginBottom: "0.5rem",
            }}
          >
            No questions added yet
          </h2>
          <p
            style={{
              color: "var(--text-secondary)",
              maxWidth: "480px",
              margin: "0 auto 2rem",
              fontSize: "1rem",
              lineHeight: 1.6,
            }}
          >
            Start building your interactive assessment by adding multiple
            choice, true/false, or essay questions.
          </p>
          <button onClick={onAddFirst} className="btn btn-primary btn-lg">
            Add Your First Question
          </button>
        </div>
      ) : (
        /* Populated Questions List */
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
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
