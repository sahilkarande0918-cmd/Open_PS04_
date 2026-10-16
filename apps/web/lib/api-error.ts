/** Surface validation messages without copying request inputs (OAuth codes can be among them). */
export function apiErrorMessage(body: unknown, status: number): string {
  if (body && typeof body === "object" && "detail" in body) {
    const detail = body.detail;
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail)) {
      const messages = detail.flatMap((item) => {
        if (!item || typeof item !== "object" || typeof item.msg !== "string") return [];
        const field = Array.isArray(item.loc) ? item.loc.filter((part: unknown) => typeof part === "string" && part !== "body").join(" · ") : "";
        return [field ? `${field}: ${item.msg}` : item.msg];
      });
      if (messages.length) return messages.join(". ");
    }
  }
  return `The request failed (${status}). Please try again.`;
}
