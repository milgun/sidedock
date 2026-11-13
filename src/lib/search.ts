import { CATEGORY_LABELS } from "./categories.ts";

type SearchItem = Record<string, unknown>;

function getStringValue(item: SearchItem, key: string) {
  const value = item[key];
  return typeof value === "string" ? value : "";
}

function getStringArrayValue(item: SearchItem, key: string) {
  const value = item[key];
  if (Array.isArray(value)) {
    return value.filter((entry): entry is string => typeof entry === "string");
  }
  if (typeof value === "string") {
    return value.split(/[,|]/).map((entry) => entry.trim()).filter(Boolean);
  }
  return [];
}

export const SEARCH_RESULT_LIMIT = 100;

// 카테고리는 DB에 영문 키로 저장되지만 화면에는 한글 라벨로 보이므로 둘 다 검색 대상으로 삼는다.
function getProductTagValues(item: SearchItem) {
  const categoryKeys = [
    getStringValue(item, "category"),
    ...getStringArrayValue(item, "categories"),
  ].filter(Boolean);
  const categoryLabels = categoryKeys.map((key) => CATEGORY_LABELS[key] ?? "");
  return [...categoryKeys, ...categoryLabels, ...getStringArrayValue(item, "tags")].filter(Boolean);
}

function getDevlogTagValues(item: SearchItem) {
  return getStringArrayValue(item, "tags");
}

export function matchesSearchQuery(item: SearchItem, type: "products" | "devlogs", queryText: string) {
  const normalizedQuery = queryText.trim().toLowerCase();
  if (!normalizedQuery) return true;

  const title = type === "products"
    ? getStringValue(item, "name")
    : getStringValue(item, "title");
  const body = type === "products"
    ? `${getStringValue(item, "tagline")} ${getStringValue(item, "description")}`.trim()
    : `${getStringValue(item, "content")}`.trim();
  const tags = type === "products" ? getProductTagValues(item) : getDevlogTagValues(item);

  const haystacks = [title, body, ...tags].map((value) => value.toLowerCase());
  return haystacks.some((value) => value.includes(normalizedQuery));
}

// PostgREST or() 필터 문법을 깨뜨리는 문자와 LIKE 와일드카드를 제거한다.
function sanitizeFilterTerm(queryText: string) {
  return queryText.replace(/[%_\\",()*:{}]/g, " ").replace(/\s+/g, " ").trim();
}

function isSimpleTagTerm(term: string) {
  return /^[\p{L}\p{N}_-]+$/u.test(term);
}

// 전체 목록을 일부만 가져온 뒤 걸러내면 오래된/뒤쪽 데이터가 누락되므로 DB에서 먼저 후보를 좁힌다.
export function buildSearchOrFilter(type: "products" | "devlogs", queryText: string) {
  const term = sanitizeFilterTerm(queryText);
  if (!term) return null;

  const pattern = `"%${term}%"`;
  const lowerTerm = term.toLowerCase();
  const clauses: string[] = [];

  if (type === "products") {
    clauses.push(`name.ilike.${pattern}`, `tagline.ilike.${pattern}`, `description.ilike.${pattern}`);

    const categoryKeys = Object.entries(CATEGORY_LABELS)
      .filter(([key, label]) => key.includes(lowerTerm) || label.toLowerCase().includes(lowerTerm))
      .map(([key]) => key);
    if (categoryKeys.length > 0) {
      clauses.push(`category.in.(${categoryKeys.join(",")})`, `categories.ov.{${categoryKeys.join(",")}}`);
    }
  } else {
    clauses.push(`title.ilike.${pattern}`, `content.ilike.${pattern}`);
  }

  if (isSimpleTagTerm(term)) {
    const variants = Array.from(new Set([term, lowerTerm]));
    for (const variant of variants) clauses.push(`tags.cs.{${variant}}`);
  }

  return clauses.join(",");
}

function getDateValue(item: SearchItem) {
  const value = item.created_at;
  if (typeof value === "string" && value) return new Date(value);
  if (value instanceof Date) return value;
  return new Date(0);
}

export function sortSearchResults<T extends SearchItem>(
  items: T[],
  type: "products" | "devlogs",
  query: string,
  sort: "relevance" | "newest"
): T[] {
  const queryText = query.trim().toLowerCase();

  if (sort === "newest") {
    return [...items].sort((a, b) => getDateValue(b).getTime() - getDateValue(a).getTime());
  }

  return [...items].sort((a, b) => {
    const aScore = scoreItem(a, type, queryText);
    const bScore = scoreItem(b, type, queryText);
    if (aScore !== bScore) return bScore - aScore;
    return getDateValue(b).getTime() - getDateValue(a).getTime();
  });
}

function scoreItem(item: SearchItem, type: "products" | "devlogs", queryText: string) {
  const title = type === "products"
    ? getStringValue(item, "name")
    : getStringValue(item, "title");
  const body = type === "products"
    ? `${getStringValue(item, "tagline")} ${getStringValue(item, "description")}`.trim()
    : `${getStringValue(item, "content")}`.trim();
  const tags = (type === "products" ? getProductTagValues(item) : getDevlogTagValues(item)).join(" ");

  const fullText = `${title} ${tags} ${body}`.toLowerCase();
  const titleText = title.toLowerCase();
  const tagText = tags.toLowerCase();
  const bodyText = body.toLowerCase();

  let score = 0;
  if (!queryText) return score;

  if (fullText.includes(queryText)) score += 3;
  if (titleText.includes(queryText)) score += 4;
  if (tagText.includes(queryText)) score += 3;
  if (bodyText.includes(queryText)) score += 1;
  return score;
}
