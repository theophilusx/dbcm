"use strict";

const VError = require("verror");
const AppState = require("./AppState");
const userOptions = require("./tui/userOptions");
const selectRepository = require("./tui/repo/selectRepository");
const dumper = require("./dumper");
const path = require("path");
const selectTarget = require("./tui/targets/selectTarget");
const mainui = require("./tui/mainUI");

async function main() {
  const logName = "main";
  const appState = new AppState();
  const rcFile = path.join(process.env.HOME, ".dbcmrc");

  try {
    await appState.init(rcFile);
    if (!appState.username()) {
      await userOptions(appState);
      await appState.writeUserInit();
    }
    await selectRepository(appState);
    await selectTarget(appState);
    await mainui.mainMenu(appState);
  } catch (err) {
    console.log(dumper.dumpValue(appState, "", "appState"));
    throw new VError(err, `${logName}`);
  }
}

main().catch(err => {
  console.error(err.message);
});
