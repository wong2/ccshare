import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";
import { getProjectsDir, getSessionsIndexPath } from "./paths.js";
import type {
  SessionEntry,
  SessionsIndex,
  RawMessageRecord,
  SessionMessage,
  Session,
  ListSessionsOptions,
  ReadSessionOptions,
} from "./types.js";

/**
 * List all projects that have Claude Code session data.
 * Returns the original project paths.
 */
export function listProjects(): string[] {
  const projectsDir = getProjectsDir();
  if (!existsSync(projectsDir)) {
    return [];
  }

  const paths: string[] = [];
  for (const dir of readdirSync(projectsDir)) {
    const indexPath = join(projectsDir, dir, "sessions-index.json");
    if (existsSync(indexPath)) {
      try {
        const content = readFileSync(indexPath, "utf-8");
        const index = JSON.parse(content) as SessionsIndex;
        if (index.originalPath) {
          paths.push(index.originalPath);
        }
      } catch {
        // skip malformed index
      }
    }
  }
  return paths;
}

/**
 * List all sessions for a given project path, sorted by modification time (newest first).
 */
export function listSessions(
  projectPath: string,
  options: ListSessionsOptions = {},
): SessionEntry[] {
  const { filterEmpty = true, includeSidechains = false } = options;

  const indexPath = getSessionsIndexPath(projectPath);
  if (!existsSync(indexPath)) {
    return [];
  }

  let index: SessionsIndex;
  try {
    const content = readFileSync(indexPath, "utf-8");
    index = JSON.parse(content) as SessionsIndex;
  } catch {
    return [];
  }

  let entries = index.entries;

  if (!includeSidechains) {
    entries = entries.filter((e) => !e.isSidechain);
  }
  if (filterEmpty) {
    entries = entries.filter((e) => e.messageCount > 0);
  }

  // Sort by modified descending
  entries.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());

  return entries;
}

function parseRawMessage(record: RawMessageRecord): SessionMessage | null {
  if (!record.message || record.type === "file-history-snapshot") {
    return null;
  }

  return {
    uuid: record.uuid,
    parentUuid: record.parentUuid,
    timestamp: record.timestamp,
    isSidechain: record.isSidechain,
    role: record.message.role,
    content: record.message.content,
    model: record.message.model,
    stopReason: record.message.stop_reason,
    usage: record.message.usage
      ? {
          inputTokens: record.message.usage.input_tokens,
          outputTokens: record.message.usage.output_tokens,
        }
      : undefined,
  };
}

/**
 * Read a full session by its entry, returning all messages.
 */
export function readSession(
  entry: SessionEntry,
  options: ReadSessionOptions = {},
): Session {
  const { includeSidechainMessages = false } = options;
  const messages: SessionMessage[] = [];

  if (existsSync(entry.fullPath)) {
    try {
      const content = readFileSync(entry.fullPath, "utf-8");
      for (const line of content.trim().split("\n")) {
        try {
          const record = JSON.parse(line) as RawMessageRecord;
          if (!includeSidechainMessages && record.isSidechain) continue;
          const msg = parseRawMessage(record);
          if (msg) {
            messages.push(msg);
          }
        } catch {
          // skip malformed line
        }
      }
    } catch {
      // file read error
    }
  }

  return {
    sessionId: entry.sessionId,
    fullPath: entry.fullPath,
    firstPrompt: entry.firstPrompt,
    summary: entry.summary,
    messageCount: entry.messageCount,
    created: entry.created,
    modified: entry.modified,
    gitBranch: entry.gitBranch,
    projectPath: entry.projectPath,
    isSidechain: entry.isSidechain,
    messages,
  };
}
