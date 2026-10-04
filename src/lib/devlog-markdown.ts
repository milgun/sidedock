export function formatDevlogMarkdown(content: string): string {
  const parts = content.split(/(```[\s\S]*?```)/g);
  return parts
    .map((part, partIndex) => {
      if (partIndex % 2 === 1) return part;

      const lines = part.split(/\r?\n/);
      const normalizedLines: string[] = [];

      for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
        const line = lines[lineIndex];
        const integerLine = line.match(/^[ \t]*(?:>[ \t]*)?(\d+)[ \t]*$/);

        if (integerLine) {
          let previousIndex = normalizedLines.length - 1;
          while (
            previousIndex >= 0 &&
            /^[ \t]*(?:>[ \t]*)?$/.test(normalizedLines[previousIndex])
          ) {
            previousIndex -= 1;
          }

          const previousQuote = normalizedLines[previousIndex]?.match(/^([ \t]*)>[ \t]*(.+)$/);
          const separatorLines = normalizedLines.slice(previousIndex + 1);

          // Merge a quoted label and a quoted integer split by blank quote lines.
          if (
            previousQuote &&
            !/^\d+$/.test(previousQuote[2].trim()) &&
            separatorLines.every((separator) => /^[ \t]*(?:>[ \t]*)?$/.test(separator))
          ) {
            normalizedLines.splice(previousIndex + 1);
            normalizedLines.push(`${previousQuote[1]}> ${integerLine[1]}`);
            continue;
          }
        }

        normalizedLines.push(line);
      }

      return normalizedLines
        .map((line, lineIndex) => {
          const next = normalizedLines[lineIndex + 1] ?? "";
          if (line.trimStart().startsWith("|") || next.trimStart().startsWith("|")) {
            return line;
          }
          if (line !== "" && next !== "") {
            return line + "  ";
          }
          return line;
        })
        .join("\n");
    })
    .join("");
}
