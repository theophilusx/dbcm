"use strict";

const VError = require("verror");
const repoui = require("./repoUI");
const targetui = require("./targetUI");
const configui = require("./configUI");
const state = require("./state");
const mainui = require("./mainUI");
const git = require("./git");
const plans = require("./plans");
const approvals = require("./approvals");
const menu = require("./textMenus");

async function main() {
  let appState;

  try {
    appState = await state.createApplicationState();
    if (!appState.username()) {
      appState = await configui.getConfig(appState);
    }
    if (appState.currentRepository() === undefined) {
      appState = await repoui.selectRepository(appState);
    }
    if (menu.doExit(appState.menuChoice())) {
      process.exit();
    }
    appState = await git.setupRepository(appState);
    appState = await plans.readPlanFiles(appState);
    appState = await approvals.readApprovalsFile(appState);
    if (appState.currentTarget() === undefined) {
      appState = await targetui.selectTarget(appState);
    }
    appState = await mainui.mainMenu(appState);
    console.log("Exiting DBCM");
    appState.writeConfigFile();
  } catch (err) {
    throw new VError(err, "Main loop error");
  }
}

main()
  .catch(err => {
    console.error(err.message);
  });
