"use strict";

const VError = require("verror");
const AppState = require("./AppState");
const user = require("./tui/userUI");
const repo = require("./tui/repoUI.js");
const dumper = require("./dumper");
const path = require("path");
const target = require("./tui/targetUI");
const mainui = require("./tui/mainUI");

// const repoui = require("./repoUI");
// const targetui = require("./targetUI");
// const configui = require("./configUI");
// const state = require("./state");

// const git = require("./git");
// const plans = require("./plans");
// const approvals = require("./approvals");
// const menu = require("./textMenus");

// async function main() {
//   let appState;

//   try {
//     appState = await state.createApplicationState();
//     if (!appState.username()) {
//       appState = await configui.getConfig(appState);
//     }
//     if (!appState.currentRepository()) {
//       appState = await repoui.selectRepository(appState);
//     }
//     if (menu.doExit(appState.menuChoice())) {
//       process.exit();
//     }
//     appState = await git.setupRepository(appState);
//     appState = await plans.readPlanFiles(appState);
//     appState = await approvals.readApprovalsFile(appState);
//     if (!appState.currentTarget()) {
//       appState = await targetui.selectTarget(appState);
//     }
//     await appState.writeConfigFile();
//     appState = await mainui.mainMenu(appState);
//     console.log("Exiting DBCM");
//     await appState.writeConfigFile();
//   } catch (err) {
//     throw new VError(err, "Main loop error");
//   }
// }

async function main() {
  const logName = "main";
  const appState = new AppState();
  const rcFile = path.join(process.env.HOME, ".dbcmrc");
  
  try {
    await appState.init(rcFile);
    if (!appState.username()) {
      await user.getOptions(appState);
    }
    await repo.selectRepository(appState);
    await target.selectTarget(appState);
    await mainui.mainMenu(appState);
    console.log(dumper.dumpValue(appState, "", "appState"));
  } catch (err) {
    throw new VError(err, `${logName}`);
  }
}

main()
  .catch(err => {
    console.error(err.message);
  });

