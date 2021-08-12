// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import * as cp from "child_process";

const execShell = (cmd: string) =>
    new Promise<string>((resolve, reject) => {
        cp.exec(cmd, (err, out) => {
            if (err) {
                return reject(err);
            }
            return resolve(out);
        });
    });

export function activate (context: vscode.ExtensionContext) {
  const disposable = vscode.commands.registerCommand(
    "vs-code-gitpod.open",
    () => {
      vscode.window.showInformationMessage("Opening... gaming");

	// get the git origin
	execShell(`cd ${process.env.cwd}; dir`).then(origin => {
		console.log(origin);
	}).catch(err => {
		vscode.window.showErrorMessage("Error: " + err);
	});
      //vscode.env.openExternal(vscode.Uri.parse("https://gitpod.io/"));
    }
  );

  context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
