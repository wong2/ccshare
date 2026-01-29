import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { join, basename } from "path";
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
 * Convert a mapped directory name back to the original project path.
 * The mapping replaces `/` and `.` with `-`, so we try to recover `/` for path separators.
 * Note: This is a best-effort heuristic since the mapping is not perfectly reversible.
 */
function mappedNameToProjectPath(mappedName: string): string {
  // The mapped name starts with `-` because paths start with `/`
  // e.g., "-Users-green-inbox-chyrp-lite" -> "/Users/green/inbox/chyrp-lite"
  if (mappedName.startsWith("-")) {
    return mappedName.replace(/-/g, "/");
  }
  return mappedName;
}

/**
 * Build a SessionEntry from a .jsonl file by reading its contents.
 */
function buildSessionEntryFromFile(
  filePath: string,
  projectPath: string,
): SessionEntry | null {
  if (!existsSync(filePath)) {
    return null;
  }

  try {
    const stat = statSync(filePath);
    const content = readFileSync(filePath, "utf-8");
    const lines = content.trim().split("\n").filter(Boolean);

    if (lines.length === 0) {
      return null;
    }

    let sessionId = "";
    let firstPrompt = "";
    let gitBranch = "";
    let created = "";
    let modified = "";
    let messageCount = 0;
    let isSidechain = false;

    for (const line of lines) {
      try {
        const record = JSON.parse(line) as RawMessageRecord;

        if (!sessionId && record.sessionId) {
          sessionId = record.sessionId;
        }

        if (record.type === "file-history-snapshot") {
          continue;
        }

        messageCount++;

        if (!created && record.timestamp) {
          created = record.timestamp;
        }
        modified = record.timestamp || modified;

        if (!gitBranch && record.gitBranch) {
          gitBranch = record.gitBranch;
        }

        if (record.isSidechain) {
          isSidechain = true;
        }

        // Get first user prompt
        if (
          !firstPrompt &&
          record.type === "user" &&
          record.message?.content
        ) {
          const content = record.message.content;
          if (typeof content === "string") {
            firstPrompt = content.slice(0, 200);
          } else if (Array.isArray(content)) {
            const textBlock = content.find((b) => b.type === "text");
            if (textBlock && "text" in textBlock) {
              firstPrompt = textBlock.text.slice(0, 200);
            }
          }
        }
      } catch {
        // skip malformed line
      }
    }

    // If no sessionId found in file, derive from filename
    if (!sessionId) {
      sessionId = basename(filePath, ".jsonl");
    }

    return {
      sessionId,
      fullPath: filePath,
      fileMtime: stat.mtimeMs,
      firstPrompt,
      summary: "",
      messageCount,
      created: created || stat.birthtime.toISOString(),
      modified: modified || stat.mtime.toISOString(),
      gitBranch,
      projectPath,
      isSidechain,
    };
  } catch {
    return null;
  }
}

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
    const dirPath = join(projectsDir, dir);
    const stat = statSync(dirPath);
    if (!stat.isDirectory()) {
      continue;
    }

    const indexPath = join(dirPath, "sessions-index.json");
    if (existsSync(indexPath)) {
      // New format: read from sessions-index.json
      try {
        const content = readFileSync(indexPath, "utf-8");
        const index = JSON.parse(content) as SessionsIndex;
        if (index.originalPath) {
          paths.push(index.originalPath);
        }
      } catch {
        // skip malformed index
      }
    } else {
      // Old format: check if directory has any .jsonl files
      const hasJsonlFiles = readdirSync(dirPath).some((f) =>
        f.endsWith(".jsonl"),
      );
      if (hasJsonlFiles) {
        paths.push(mappedNameToProjectPath(dir));
      }
    }
  }
  return paths;
}

/**
 * Get the project directory path for a given project path.
 */
function getProjectDir(projectPath: string): string {
  const projectsDir = getProjectsDir();
  const mappedName = projectPath.replace(/\//g, "-").replace(/\./g, "-");
  return join(projectsDir, mappedName);
}

/**
 * List sessions by scanning .jsonl files directly (for old format without sessions-index.json).
 */
function listSessionsFromFiles(
  projectPath: string,
  options: ListSessionsOptions,
): SessionEntry[] {
  const { filterEmpty = true, includeSidechains = false } = options;

  const projectDir = getProjectDir(projectPath);
  if (!existsSync(projectDir)) {
    return [];
  }

  const entries: SessionEntry[] = [];
  const files = readdirSync(projectDir).filter((f) => f.endsWith(".jsonl"));

  for (const file of files) {
    const filePath = join(projectDir, file);
    const entry = buildSessionEntryFromFile(filePath, projectPath);
    if (entry) {
      entries.push(entry);
    }
  }

  let filtered = entries;

  if (!includeSidechains) {
    filtered = filtered.filter((e) => !e.isSidechain);
  }
  if (filterEmpty) {
    filtered = filtered.filter((e) => e.messageCount > 0);
  }

  // Sort by modified descending
  filtered.sort(
    (a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime(),
  );

  return filtered;
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

  // If no sessions-index.json, fall back to scanning .jsonl files
  if (!existsSync(indexPath)) {
    return listSessionsFromFiles(projectPath, options);
  }

  let index: SessionsIndex;
  try {
    const content = readFileSync(indexPath, "utf-8");
    index = JSON.parse(content) as SessionsIndex;
  } catch {
    // If index is malformed, try falling back to file scanning
    return listSessionsFromFiles(projectPath, options);
  }

  let entries = index.entries;

  if (!includeSidechains) {
    entries = entries.filter((e) => !e.isSidechain);
  }
  if (filterEmpty) {
    entries = entries.filter((e) => e.messageCount > 0);
  }

  // Sort by modified descending
  entries.sort(
    (a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime(),
  );

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
