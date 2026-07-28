import assert from "node:assert/strict";
import test from "node:test";
import { matchesSearchQuery, sortSearchResults } from "../src/lib/search.ts";

test("sortSearchResults prioritizes exact name matches for relevance", () => {
  const items = [
    {
      id: "1",
      name: "Alpha Studio",
      tagline: "Creative tools",
      created_at: "2024-01-01T00:00:00.000Z",
    },
    {
      id: "2",
      name: "Beta Toolbox",
      tagline: "Alpha workflow assistant",
      created_at: "2024-02-01T00:00:00.000Z",
    },
  ];

  const result = sortSearchResults(items as Array<Record<string, unknown>>, "products", "alpha", "relevance");

  assert.equal(result[0].id, "1");
  assert.equal(result[1].id, "2");
});

test("sortSearchResults prioritizes tag matches over body matches", () => {
  const items = [
    {
      id: "1",
      title: "Generic post",
      content: "This post mentions alpha in the body.",
      tags: "general",
      created_at: "2024-01-01T00:00:00.000Z",
    },
    {
      id: "2",
      title: "Alpha tagged post",
      content: "This post is about something else.",
      tags: "alpha",
      created_at: "2024-02-01T00:00:00.000Z",
    },
  ];

  const result = sortSearchResults(items as Array<Record<string, unknown>>, "devlogs", "alpha", "relevance");

  assert.equal(result[0].id, "2");
  assert.equal(result[1].id, "1");
});

test("sortSearchResults orders newest first when requested", () => {
  const items = [
    {
      id: "1",
      title: "Older post",
      content: "A post about alpha",
      created_at: "2023-01-01T00:00:00.000Z",
    },
    {
      id: "2",
      title: "Newer post",
      content: "A post about alpha",
      created_at: "2024-01-01T00:00:00.000Z",
    },
  ];

  const result = sortSearchResults(items as Array<Record<string, unknown>>, "devlogs", "alpha", "newest");

  assert.equal(result[0].id, "2");
  assert.equal(result[1].id, "1");
});

test("matchesSearchQuery finds category and tag values", () => {
  const item = {
    name: "Example Product",
    tagline: "A tool",
    category: "dev-tool",
    categories: ["api", "backend"],
    tags: ["database", "postgres"],
  };

  assert.equal(matchesSearchQuery(item as Record<string, unknown>, "products", "backend"), true);
  assert.equal(matchesSearchQuery(item as Record<string, unknown>, "products", "api"), true);
  assert.equal(matchesSearchQuery(item as Record<string, unknown>, "devlogs", "postgres"), true);
});
