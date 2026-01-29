import chalk from "chalk";
import { search } from "@inquirer/prompts";
import type { SessionEntry } from "@ccshare/sdk";
import { truncate, formatDate, cleanPrompt } from "../utils/format.js";

function findCommonPrefix(paths: string[]): string {
  if (paths.length === 0) return "";
  const parts = paths[0].split("/");
  let prefixLen = parts.length;
  for (const p of paths) {
    const pp = p.split("/");
    prefixLen = Math.min(prefixLen, pp.length);
    for (let i = 0; i < prefixLen; i++) {
      if (pp[i] !== parts[i]) {
        prefixLen = i;
        break;
      }
    }
  }
  return parts.slice(0, prefixLen).join("/");
}

function buildSearchText(session: SessionEntry, stripPrefix: string): string {
  const project = session.projectPath.slice(stripPrefix.length) || session.projectPath;
  const prompt = session.firstPrompt ? cleanPrompt(session.firstPrompt) : "";
  const branch = session.gitBranch || "";
  return [project, prompt, branch].join(" ").toLowerCase();
}

export async function selectSession(sessions: SessionEntry[]): Promise<SessionEntry> {
  const prefix = findCommonPrefix(sessions.map((s) => s.projectPath));
  const stripPrefix = prefix ? prefix + "/" : "";

  const items = sessions.map((session) => {
    const project = session.projectPath.slice(stripPrefix.length) || session.projectPath;
    const msgCount = `${session.messageCount} msgs`;
    const date = formatDate(session.modified);
    const branch = session.gitBranch ? chalk.cyan(`[${session.gitBranch}]`) : "";

    const header = [chalk.magenta(project), chalk.gray(msgCount), chalk.gray(date), branch]
      .filter(Boolean)
      .join("  ");

    const promptLine = session.firstPrompt
      ? `  ${chalk.gray("→")} ${truncate(cleanPrompt(session.firstPrompt), 70)}`
      : `  ${chalk.gray("→")} ${chalk.gray("(no prompt)")}`;

    const searchText = buildSearchText(session, stripPrefix);

    return { header, promptLine, value: session, searchText };
  });

  function toChoices(filtered: typeof items) {
    return filtered.map((item, i) => {
      const suffix = i === filtered.length - 1 ? "" : "\n";
      const name = `${item.header}\n${item.promptLine}${suffix}`;
      return { name, value: item.value };
    });
  }

  return search({
    message: "Select a session to share:",
    pageSize: 20,
    source: async (input) => {
      const filtered = input
        ? items.filter((item) => item.searchText.includes(input.toLowerCase()))
        : items;
      return toChoices(filtered);
    },
  });
}
