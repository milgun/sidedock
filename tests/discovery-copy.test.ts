import assert from "node:assert/strict";
import test from "node:test";
import { DISCOVERY_COPY_MAX_LENGTH, getDiscoveryIntro, parseDiscoveryCopy } from "../src/lib/discovery-copy.ts";

test("discovery copy is trimmed, can be cleared, and rejects invalid input", () => {
  assert.deepEqual(parseDiscoveryCopy("  궁금한 이야기\n  "), { value: "궁금한 이야기" });
  assert.deepEqual(parseDiscoveryCopy(" \n "), { value: null });
  assert.deepEqual(parseDiscoveryCopy("가".repeat(DISCOVERY_COPY_MAX_LENGTH)), { value: "가".repeat(DISCOVERY_COPY_MAX_LENGTH) });
  assert.ok("error" in parseDiscoveryCopy("가".repeat(DISCOVERY_COPY_MAX_LENGTH + 1)));
  assert.ok("error" in parseDiscoveryCopy(null));
});

test("discovery intro shows the original description without a custom copy", () => {
  assert.equal(getDiscoveryIntro(null, "메이커"), "Sidedock이 발견한 메이커의 새 서비스입니다.");
  assert.equal(getDiscoveryIntro("  ", "메이커"), "Sidedock이 발견한 메이커의 새 서비스입니다.");
  assert.equal(getDiscoveryIntro(" 궁금한 이야기 ", "메이커"), "궁금한 이야기");
});
