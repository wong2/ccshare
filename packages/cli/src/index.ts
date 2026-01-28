#!/usr/bin/env node

import chalk from "chalk";
import { ExitPromptError } from "@inquirer/core";
import { listProjects, listSessions, readSession } from "@ccshare/sdk";
import type { SessionEntry } from "@ccshare/sdk";
import { selectSession } from "./commands/select.js";
import { truncate, extractText } from "./utils/format.js";

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

  console.log(chalk.bold.cyan(`━━━ Session: ${session.sessionId} ━━━`));
  console.log(chalk.gray(`Messages: ${session.messageCount} | Modified: ${session.modified}`));
  if (session.gitBranch) {
    console.log(chalk.gray(`Branch: ${session.gitBranch}`));
  }
  console.log();

  for (const msg of session.messages) {
    const text = extractText(msg.content);
    if (!text) continue;

    if (msg.role === "user") {
      console.log(chalk.blue.bold("User:"));
      console.log(text);
    } else {
      console.log(chalk.green.bold("Assistant:"));
      console.log(text.length > 500 ? truncate(text, 500) : text);
    }
    console.log();
  }
}

main().catch((error) => {
  if (error instanceof ExitPromptError) {
    process.exit(0);
  }
  console.error(chalk.red("Error:"), error.message);
  process.exit(1);
});
