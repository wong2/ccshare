// ---- Content block types (matching Claude API response format) ----

export interface TextBlock {
  type: "text";
  text: string;
}

export interface ThinkingBlock {
  type: "thinking";
  thinking: string;
  signature: string;
}

export interface ToolUseBlock {
  type: "tool_use";
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResultBlock {
  type: "tool_result";
  tool_use_id: string;
  content: string | Array<{ type: string; text?: string }>;
}

export type ContentBlock = TextBlock | ThinkingBlock | ToolUseBlock | ToolResultBlock;

// ---- Raw NDJSON message structure ----

export interface RawMessageRecord {
  type: "user" | "assistant" | "file-history-snapshot";
  uuid: string;
  parentUuid: string | null;
  sessionId: string;
  timestamp: string;
  isSidechain: boolean;
  userType?: string;
  cwd?: string;
  version?: string;
  gitBranch?: string;
  message?: {
    role: "user" | "assistant";
    content: string | ContentBlock[];
    model?: string;
    id?: string;
    type?: string;
    stop_reason?: string | null;
    usage?: {
      input_tokens: number;
      output_tokens: number;
      cache_creation_input_tokens?: number;
      cache_read_input_tokens?: number;
    };
  };
  requestId?: string;
  thinkingMetadata?: {
    maxThinkingTokens: number;
  };
  todos?: unknown[];
  permissionMode?: string;
}

// ---- Session index types ----

export interface SessionEntry {
  sessionId: string;
  fullPath: string;
  fileMtime: number;
  firstPrompt: string;
  summary: string;
  messageCount: number;
  created: string;
  modified: string;
  gitBranch: string;
  projectPath: string;
  isSidechain: boolean;
}

export interface SessionsIndex {
  version: number;
  entries: SessionEntry[];
  originalPath: string;
}

// ---- SDK message types ----

export interface SessionMessage {
  uuid: string;
  parentUuid: string | null;
  timestamp: string;
  isSidechain: boolean;
  role: "user" | "assistant";
  content: string | ContentBlock[];
  /** Only present for assistant messages */
  model?: string;
  /** Only present for assistant messages */
  stopReason?: string | null;
  /** Only present for assistant messages */
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
}

export interface Session {
  sessionId: string;
  fullPath: string;
  firstPrompt: string;
  summary: string;
  messageCount: number;
  created: string;
  modified: string;
  gitBranch: string;
  projectPath: string;
  isSidechain: boolean;
  messages: SessionMessage[];
}

// ---- Options ----

export interface ListSessionsOptions {
  /** Only include non-sidechain sessions with messages. Default: true */
  filterEmpty?: boolean;
  /** Include sidechain sessions. Default: false */
  includeSidechains?: boolean;
}

export interface ReadSessionOptions {
  /** Include sidechain messages. Default: false */
  includeSidechainMessages?: boolean;
}
