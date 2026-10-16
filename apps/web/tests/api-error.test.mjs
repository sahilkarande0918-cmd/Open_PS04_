import assert from "node:assert/strict";
import test from "node:test";
import { apiErrorMessage } from "../lib/api-error.ts";

test("shows the backend's actionable refusal", () => {
  assert.equal(apiErrorMessage({ detail: "Choose a future schedule time" }, 422), "Choose a future schedule time");
});

test("shows Pydantic field validation without echoing OAuth credentials", () => {
  const message = apiErrorMessage({ detail: [{ loc: ["body", "state"], msg: "String should have at least 32 characters", input: "private-oauth-state", ctx: { secret: "private" } }] }, 422);
  assert.equal(message, "state: String should have at least 32 characters");
  assert.ok(!message.includes("private"));
});

test("handles multiple field errors", () => {
  assert.equal(apiErrorMessage({ detail: [{ loc: ["body", "topic"], msg: "Too long" }, { loc: ["body", "audience"], msg: "Required" }] }, 422), "topic: Too long. audience: Required");
});

test("invalid or non-JSON error bodies use a safe status fallback", () => {
  for (const body of [null, "invalid", { detail: null }, { detail: [null, {}, { input: "private" }] }]) {
    assert.equal(apiErrorMessage(body, 502), "The request failed (502). Please try again.");
  }
});
