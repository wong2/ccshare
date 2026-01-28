import { homedir } from "os";
import { join } from "path";

export function getClaudeHome(): string {
  return join(homedir(), ".claude");
}

export function getProjectsDir(): string {
  return join(getClaudeHome(), "projects");
}

export function projectPathToMappedName(projectPath: string): string {
  return projectPath.replace(/\//g, "-").replace(/\./g, "-");
}

export function getSessionsIndexPath(projectPath: string): string {
  const mappedName = projectPathToMappedName(projectPath);
  return join(getProjectsDir(), mappedName, "sessions-index.json");
}
