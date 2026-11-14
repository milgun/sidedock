export const COMMENT_TOPICS = {
  question: {
    hint: "👀 궁금한 점",
    label: "👀 궁금해요",
    prompt: "이 제품에 대해 어떤 점이 궁금하신가요?",
  },
  impression: {
    hint: "✨ 인상적인 점",
    label: "✨ 인상적이에요",
    prompt: "어떤 점이 눈길을 끌었나요?",
  },
  idea: {
    hint: "💡 떠오른 아이디어",
    label: "💡 아이디어",
    prompt: "어떤 아이디어가 떠오르셨나요?",
  },
} as const;

export type CommentTopic = keyof typeof COMMENT_TOPICS;

export function isCommentTopic(value: unknown): value is CommentTopic {
  return typeof value === "string" && Object.prototype.hasOwnProperty.call(COMMENT_TOPICS, value);
}

export function isValidCommentTopic(value: unknown, isReply: boolean): boolean {
  return value === null || (!isReply && isCommentTopic(value));
}
