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
    return Promise.reject(new Error("Not a git repository"));
  }
};

const allowedDomains = ["github.com", "gitlab.com"];

export function activate(context: vscode.ExtensionContext) {
  const folderPath = vscode.workspace.workspaceFolders?.[0].uri.fsPath;

  let gitOrigin = "";
  let openable = false;

  // get the git origin
  execShell(`git config --get remote.origin.url`, folderPath || "./")
    .then((origin) => {
      const urlObject = new URL(origin);
      const domain = urlObject.hostname;

      if (allowedDomains.includes(domain)) {
        // If the domain is allowed, open the project in GitPod (in the user's default browser)
        openable = true;
        gitOrigin = origin;

        // Upon activation, create a status bar item
        const statusBarItem = vscode.window.createStatusBarItem(
          vscode.StatusBarAlignment.Left
        );

        statusBarItem.text = "$(code) Open in GitPod";
        statusBarItem.command = "vs-code-gitpod.open";
        statusBarItem.show();
      }
    })
    .catch((err) => {
      vscode.window.showErrorMessage("Error: " + err);
    });

  const disposable = vscode.commands.registerCommand(
    "vs-code-gitpod.open",
    () => {
      vscode.window.showInformationMessage("Opening in GitPod... ");

      if (!vscode.workspace) {
        return vscode.window.showErrorMessage(
          "Please open a project folder first"
        );
      }

      if (!openable) {
        vscode.window.showErrorMessage(
          `The project is not hosted on a GitLab or GitHub server and cannot be opened with GitPod.`
        );
      } else {
        vscode.env.openExternal(
          vscode.Uri.parse(`https://gitpod.io/#${gitOrigin}`)
        );
      }
    }
  );

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
