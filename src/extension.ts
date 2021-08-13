// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as cp from "child_process";
import { URL } from "url";

const execShell = (cmd: string, path: string) =>
  new Promise<string>((resolve, reject) => {
    cp.exec(cmd, { cwd: path }, (err, out) => {
      if (err) {
        return reject(err);
      }
      return resolve(out);
    });
  });

const allowedDomains = ["github.com", "gitlab.com"];

export function activate(context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "vs-code-gitpod.open",
    () => {
      vscode.window.showInformationMessage("Opening... gaming");

      if (!vscode.workspace) {
        return vscode.window.showErrorMessage(
          "Please open a project folder first"
        );
      }

      const folderPath = vscode.workspace.workspaceFolders?.[0].uri.fsPath;
      /*
        .split(":")[1];
*/
      console.log(folderPath);

      // get the git origin
      execShell(`git config --get remote.origin.url`, folderPath || "./")
        .then((origin) => {
          const urlObject = new URL(origin);
          const domain = urlObject.hostname;

          // If the domain isn't allowed, tell the user that he can't open the project in GitPod
          if (allowedDomains.includes(domain) === false) {
            vscode.window.showErrorMessage(
              `The project is not hosted on a GitLab or GitHub server and cannot be opened with GitPod.`
            );
            return;
          } else {
            // If the domain is allowed, open the project in GitPod (in the user's default browser)
            vscode.env.openExternal(vscode.Uri.parse(`https://gitpod.io/#${origin}`));
          }
        })
        .catch((err) => {
          vscode.window.showErrorMessage("Error: " + err);
        });
      //vscode.env.openExternal(vscode.Uri.parse("https://gitpod.io/"));
    }
  );

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
