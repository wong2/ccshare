import type { ContentBlock } from "@ccshare/sdk";

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 3) + "...";
}

export function formatDate(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);

  const nowDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  const diffDays = Math.floor((nowDay.getTime() - dateDay.getTime()) / (1000 * 60 * 60 * 24));

  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  if (diffDays === 0) {
    return `Today ${timeStr}`;
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
}

export function cleanPrompt(prompt: string): string {
  return prompt
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extract plain text from a SessionMessage content field.
 */
export function extractText(content: string | ContentBlock[]): string | null {
  if (typeof content === "string") {
    return content;
  }
  for (const block of content) {
    if (block.type === "text") {
      return block.text;
    }
  }
  return null;
}
