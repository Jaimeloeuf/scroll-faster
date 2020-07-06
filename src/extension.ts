// The module 'vscode' contains the VS Code extensibility API
import * as vscode from "vscode";

// Function created using Factory function to wrap over "scrollByLines" config
const linesToScrollBy = (function (): () => Number {
  var lines = vscode.workspace.getConfiguration("scrollFaster").scrollByLines;

  vscode.workspace.onDidChangeConfiguration(function (
    e: vscode.ConfigurationChangeEvent
  ) {
    // Check if configuration has been edited
    // e.affectsConfiguration

    lines = vscode.workspace.getConfiguration("scrollFaster").scrollByLines;
  });

  return () => lines;
})();

// Function created using Factory function to wrap over "cursorFollowsScroll" config
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export async function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // These code will only be executed once when your extension is activated

  function createFasterScrollCommand(direction: string) {
    return vscode.commands.registerCommand(
      `scroll-faster.${direction}`,
      async () => {
        vscode.commands.executeCommand("editorScroll", {
          to: direction,
          by: "line",
          value: linesToScrollBy(),
          revealCursor: false,
        });
      }
    );
  }

  const registeredCommandSetScrollBy = vscode.commands.registerCommand(
    "scroll-faster.setScrollBy",
    async () => {
      const input: string | undefined = await vscode.window.showInputBox({
        value: vscode.workspace.getConfiguration("scrollFaster").scrollByLines,
        prompt: "Number of lines to fast scroll using",
        validateInput: (input) =>
          // Ensure input is a number
          // Allow negative numbers for reverse scrolling
          !isNaN(Number(input)) ? undefined : "Invalid input",
      });

      // End if input box closed after losing focus or if user pressed esc or if user pressed enter with no input
      if (input === undefined || input === "") return;

      // Parse input from string to number
      const newScrollByLines = parseInt(input);

      // Save setScrollByLines to settings
      await vscode.workspace
        .getConfiguration("scrollFaster")
        .update(
          "scrollByLines",
          newScrollByLines,
          vscode.ConfigurationTarget.Global
        );

      vscode.window.setStatusBarMessage(
        `Scroll By Lines updated to '${newScrollByLines}'`,
        5000
      );
    }
  );

  context.subscriptions.push(createFasterScrollCommand("up"));
  context.subscriptions.push(createFasterScrollCommand("down"));
  context.subscriptions.push(registeredCommandSetScrollBy);
}

// this method is called when your extension is deactivated
export function deactivate() {
  // No clean up code required for this extension
}
