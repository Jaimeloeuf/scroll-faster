// The module 'vscode' contains the VS Code extensibility API
import * as vscode from "vscode";

// Function created using Factory function to wrap over "scrollByLines" config
const linesToScrollBy = (function (): () => Number {
  var lines = vscode.workspace.getConfiguration("scrollFaster").scrollByLines;

  // Regardless of what configuration is updated, just read and set value to keep it simpler
  vscode.workspace.onDidChangeConfiguration(
    () =>
      (lines = vscode.workspace.getConfiguration("scrollFaster").scrollByLines)
  );

  return () => lines;
})();

// Function created using Factory function to wrap over "cursorFollowsScroll" config
const shouldCursorFollowScroll = (function (): () => Boolean {
  var follow = vscode.workspace.getConfiguration("scrollFaster")
    .cursorFollowsScroll;

  // Regardless of what configuration is updated, just read and set value to keep it simpler
  vscode.workspace.onDidChangeConfiguration(
    () =>
      (follow = vscode.workspace.getConfiguration("scrollFaster")
        .cursorFollowsScroll)
  );

  return () => follow;
})();

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
          revealCursor: shouldCursorFollowScroll(),
        });
      }
    );
  }

  const registeredCommandSetScrollBy = vscode.commands.registerCommand(
    "scroll-faster.setScrollBy",
    async () => {
      const input: string | undefined = await vscode.window.showInputBox({
        value: linesToScrollBy().toString(),
        prompt: "Number of lines to fast scroll using",
        validateInput: (input) =>
          // Ensure input is a number
          // Allow negative numbers for reverse scrolling
          isNaN(Number(input)) ? "Invalid input" : undefined,
      });

      // End if input box closed after losing focus or if user pressed esc or if user pressed enter with no input
      if (input === undefined || input === "") return;

      // Parse input from string to number
      const newScrollByLines = parseInt(input);

      // Do not set value if new value is invalid and NaN
      if (isNaN(newScrollByLines))
        return vscode.window.setStatusBarMessage(
          `Invalid Scroll By Lines value '${input}'`,
          5000
        );

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

  const registeredCommandSetCursorFollow = vscode.commands.registerCommand(
    "scroll-faster.setCursorFollow",
    async () => {
      const currentSetting = shouldCursorFollowScroll();
      const alternateSetting = !shouldCursorFollowScroll();

      const followCursor:
        | string
        | undefined = await vscode.window.showQuickPick(
        // Use current and alternate setting to make this dynamic and show current setting first so if it is accidentally pressed, setting will not be modified
        [currentSetting.toString(), alternateSetting.toString()],
        {
          canPickMany: false,
          ignoreFocusOut: false,
          placeHolder: "Should cursor be dragged along as the editor scrolls?",
        }
      );

      // End if input box closed after losing focus or if user pressed esc or if user pressed enter with no input
      if (followCursor === undefined || followCursor === "") return;

      // Save setScrollByLines to settings
      await vscode.workspace.getConfiguration("scrollFaster").update(
        "cursorFollowsScroll",
        followCursor === "true" ? true : false, // Defaults to false if somehow value is invalid and neither true nor false
        vscode.ConfigurationTarget.Global
      );

      vscode.window.setStatusBarMessage(
        `Cursor will ${
          followCursor === "true" ? "" : "not " // Value is a string and not boolean
        }follow scrolling window's visible range`,
        5000
      );
    }
  );

  context.subscriptions.push(createFasterScrollCommand("up"));
  context.subscriptions.push(createFasterScrollCommand("down"));
  context.subscriptions.push(registeredCommandSetScrollBy);
  context.subscriptions.push(registeredCommandSetCursorFollow);
}

// this method is called when your extension is deactivated
export function deactivate() {
  // No clean up code required for this extension
}
