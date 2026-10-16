import { Fragment } from "react";

const KEYWORDS = new Set([
  "import", "from", "export", "function", "const", "return", "new", "null", "let", "if", "else",
]);
const HOOKS = new Set(["useEffect", "useState", "fetch", "AbortController"]);

/** Tiny highlighter for the landing fragments only (real code blocks use Shiki in the product). */
export function highlight(line: string) {
  const parts = line.split(/("[^"]*"|\b[A-Za-z_]+\b)/g);
  return parts.map((p, i) => {
    if (!p) return null;
    let color: string | undefined;
    if (p.startsWith('"')) color = "#b5cea8";
    else if (KEYWORDS.has(p)) color = "#c586c0";
    else if (HOOKS.has(p)) color = "#dcdcaa";
    return color ? (
      <span key={i} style={{ color }}>
        {p}
      </span>
    ) : (
      <Fragment key={i}>{p}</Fragment>
    );
  });
}

export const USE_FETCH = [
  'import { useEffect, useState } from "react";',
  "",
  "export function useFetch(url) {",
  "  const [data, setData] = useState(null);",
  "  const [error, setError] = useState(null);",
  "",
  "  useEffect(() => {",
  "    const controller = new AbortController();",
  "    fetch(url, { signal: controller.signal })",
  "      .then((res) => res.json())",
  "      .then(setData)",
  "      .catch(setError);",
  "    return () => controller.abort();",
  "  }, [url]);",
  "",
  "  return { data, error };",
  "}",
];
