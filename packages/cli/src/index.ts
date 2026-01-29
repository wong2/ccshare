#!/usr/bin/env node

import chalk from "chalk";
import open from "open";
import { ExitPromptError } from "@inquirer/core";
import { listProjects, listSessions, readSession } from "@ccshare/sdk";
import type { SessionEntry, Session } from "@ccshare/sdk";
import { selectSession } from "./commands/select.js";
import { startServer } from "./utils/server.js";

function sanitizeSession(session: Session): Omit<Session, "fullPath" | "projectPath"> {
  const { fullPath, projectPath, ...rest } = session;
  return rest;
}

async function main() {
  console.log();
  console.log(chalk.bold("  Claude Code Session Share"));
  console.log();

  const projects = listProjects();
  const sessions: SessionEntry[] = [];
  for (const project of projects) {
    sessions.push(...listSessions(project));
  }

  // Sort all sessions across projects by modified time
  sessions.sort((a, b) => new Date(b.modified).getTime() - new Date(a.modified).getTime());

  if (sessions.length === 0) {
    console.log(chalk.yellow("No sessions found."));
    process.exit(1);
  }

  console.log(chalk.gray(`Found ${sessions.length} session(s) across ${projects.length} project(s)`));
  console.log();

  const entry = await selectSession(sessions);

  console.log();
  console.log(chalk.green(`✔ Selected session ${entry.sessionId}`));
  console.log();

  const session = readSession(entry);
  const sanitized = sanitizeSession(session);

  // Start local server
  console.log(chalk.gray("Starting local server..."));
  const { url } = await startServer(sanitized);

  console.log(chalk.green(`✔ Server running at ${chalk.cyan(url)}`));
  console.log();
  console.log(chalk.gray("Opening browser..."));

  await open(url);

  console.log(chalk.gray("Press Ctrl+C to stop the server"));
}

main().catch((error) => {
  if (error instanceof ExitPromptError) {
    process.exit(0);
  }
  console.error(chalk.red("Error:"), error.message);
  process.exit(1);
});
