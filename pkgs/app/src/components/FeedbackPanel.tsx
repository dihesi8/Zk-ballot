"use client";

import { useState } from "react";
import type { FeedbackItem } from "@/lib/simulation";

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

export function FeedbackPanel({
  feedback,
  isAdmin,
  onSubmit,
  onReply,
}: {
  feedback: FeedbackItem[];
  isAdmin: boolean;
  onSubmit: (text: string) => void;
  onReply: (feedbackId: string, text: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  return (
    <div className="glass-panel p-5">
      <h3 className="text-sm font-semibold text-ink mb-1">
        Feedback &amp; questions
      </h3>
      <p className="text-xs text-ink-dim mb-4">
        Anonymous by design. No identity or commitment is attached to a
        post, from anyone, including the admin.
      </p>

      {!isAdmin && (
        <div className="flex gap-2 mb-5">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask a question or leave feedback anonymously..."
            className="glass-input flex-1 text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && draft.trim()) {
                onSubmit(draft.trim());
                setDraft("");
              }
            }}
          />
          <button
            onClick={() => {
              if (!draft.trim()) return;
              onSubmit(draft.trim());
              setDraft("");
            }}
            disabled={!draft.trim()}
            className="btn-primary px-4 py-2 text-sm shrink-0"
          >
            Post
          </button>
        </div>
      )}

      {feedback.length === 0 ? (
        <p className="text-xs text-ink-faint italic">
          No feedback yet.
        </p>
      ) : (
        <ul className="space-y-3">
          {feedback.map((item) => (
            <li
              key={item.id}
              className="bg-surface/60 border border-border/60 rounded-md p-3"
            >
              <div className="flex items-baseline justify-between mb-1">
                <span className="text-[11px] text-ink-faint">Anonymous</span>
                <span className="text-[11px] text-ink-faint">
                  {timeAgo(item.createdAt)}
                </span>
              </div>
              <p className="text-sm text-ink mb-2">{item.text}</p>

              {item.replies.map((r) => (
                <div
                  key={r.id}
                  className="ml-3 mt-2 pl-3 border-l-2 border-cyan-dim/40"
                >
                  <div className="flex items-baseline justify-between mb-0.5">
                    <span className="text-[11px] text-cyan-bright">Admin</span>
                    <span className="text-[11px] text-ink-faint">
                      {timeAgo(r.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-ink-dim">{r.text}</p>
                </div>
              ))}

              {isAdmin && (
                <div className="flex gap-2 mt-3">
                  <input
                    value={replyDrafts[item.id] ?? ""}
                    onChange={(e) =>
                      setReplyDrafts((d) => ({ ...d, [item.id]: e.target.value }))
                    }
                    placeholder="Reply as admin..."
                    className="glass-input flex-1 text-xs py-1.5"
                  />
                  <button
                    onClick={() => {
                      const text = replyDrafts[item.id];
                      if (!text?.trim()) return;
                      onReply(item.id, text.trim());
                      setReplyDrafts((d) => ({ ...d, [item.id]: "" }));
                    }}
                    disabled={!replyDrafts[item.id]?.trim()}
                    className="btn-secondary text-xs px-3"
                  >
                    Reply
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
