type SearchItem = Record<string, unknown>;

function getStringValue(item: SearchItem, key: string) {
  const value = item[key];
  return typeof value === "string" ? value : "";
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
  const tags = type === "products"
    ? `${getStringValue(item, "category")} ${getStringValue(item, "categories")}`.trim()
    : `${getStringValue(item, "tags")}`.trim();

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
