import assert from "node:assert/strict";
import test from "node:test";
import { isValidCommentTopic } from "../src/lib/comment-topics.ts";

test("top-level comments allow an optional supported topic", () => {
  for (const topic of [null, "question", "impression", "idea"]) {
    assert.equal(isValidCommentTopic(topic, false), true);
  }
  for (const topic of ["toString", "other", "", new File([], "topic")]) {
    assert.equal(isValidCommentTopic(topic, false), false);
  }
});

test("replies allow no topic but reject an explicitly selected topic", () => {
  assert.equal(isValidCommentTopic(null, true), true);
  assert.equal(isValidCommentTopic("idea", true), false);
});
