// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as cp from "child_process";
import fs = require("fs");
import path = require("path");
import { URL } from "url";

function isGitSync(dir: string) {
  return fs.existsSync(path.join(dir, ".git"));
}

class NotRepoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotRepoError";
  }
}

const execShell = (cmd: string, directory: string) => {
  if (isGitSync(directory)) {
    return new Promise<string>((resolve, reject) => {
      cp.exec(cmd, { cwd: directory }, (err, out) => {
        if (err) {
          return reject(err);
        }
        return resolve(out);
      });
    });
  } else {
    // Return an error, because we can't find the .git directory
    return Promise.reject(new NotRepoError("Not a git repository"));
  }
};

const allowedDomains = ["github.com", "gitlab.com"];

const getBranch = async (folder?: string) => {
  // get the git branch
  try {
    return await execShell(`git rev-parse --abbrev-ref HEAD`, folder || "./");
  } catch (err) {
    if (!(err instanceof NotRepoError)) {
      vscode.window.showErrorMessage(`Error: ${err}`);
    }
  }
};

export async function activate(context: vscode.ExtensionContext) {
  const folderPath = vscode.workspace.workspaceFolders?.[0].uri.fsPath;

  let openable = false;
  try {
    // get the git origin
    let origin = await execShell(`git config --get remote.origin.url`, folderPath || "./");

    const urlObject = new URL(origin);
    const domain = urlObject.hostname;

    if (allowedDomains.includes(domain)) {
      // If the domain is allowed, open the project in Gitpod (in the user's default browser)
      openable = true;
      origin = origin.trim().replace('.git', '');
      getBranch(folderPath);
    }

    const getGitpodUrl = async () => {
      if (!vscode.workspace) {
        return vscode.window.showErrorMessage(
          "Please open a project folder first"
        );
      }

      if (!openable) {
        vscode.window.showErrorMessage(
          `The project is not hosted on a GitLab or GitHub server and cannot be opened with Gitpod.`
        );
      } else {
        let uriToOpen;
        const urlObject = new URL(origin);
        const domain = urlObject.hostname;
        const gitBranch = await getBranch(folderPath);
        switch (domain) {
          case 'github.com':
            uriToOpen = `https://gitpod.io/#${origin}/tree/${gitBranch}`;
            break;
          case 'gitlab.com':
            uriToOpen = `https://gitpod.io/#${origin}/-/tree/${gitBranch}`;
            break;
          default:
            uriToOpen = origin;
        }
        return uriToOpen;

      }
    };

    const copyCommand = vscode.commands.registerCommand(
      "open-in-gitpod.copy",
      async () => {
        const uriToOpen = await getGitpodUrl();
        if (uriToOpen) {
          try {
            vscode.env.clipboard.writeText(uriToOpen);
            vscode.window.showInformationMessage("Copied the URL successfully");
          } catch (e) {
            vscode.window.showErrorMessage("Failed to copy the URL");
          }
        }
      }
    );

    const openCommand = vscode.commands.registerCommand(
      "open-in-gitpod.open",
      async () => {
        vscode.window.showInformationMessage("Opening in Gitpod... ");
        const uriToOpen = await getGitpodUrl();
        if (uriToOpen) {
          vscode.env.openExternal(
            vscode.Uri.parse(uriToOpen)
          );
        }
      }
    );
    context.subscriptions.push(openCommand, copyCommand);
  } catch (err) {
    if (!(err instanceof NotRepoError)) {
      vscode.window.showErrorMessage(`Error: ${err}`);
    }
  };
}

// this method is called when your extension is deactivated
export function deactivate() { }
