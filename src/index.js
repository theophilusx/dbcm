"use strict";

const VError = require("verror");
const repoui = require("./repoUI");
const targetui = require("./targetUI");
const configui = require("./configUI");
const state = require("./state");
const mainui = require("./mainUI");

async function main() {
  let appState;

  try {
    appState = await state.createApplicationState();
    if (!appState.username()) {
      appState = await configui.getConfig(appState);
    }
    do {
      appState = await repoui.selectRepository(appState);
      if (appState.menuChoice() === "exitMenu") {
        continue;
      }
      appState = await targetui.selectTarget(appState);
      if (appState.menuChoice() === "exitMenu") {
        continue;
      }
      do {
        appState = await mainui.mainMenu(appState);
      } while (appState.menuChoice() != "exitMenu");
    } while (appState.menuChoice() != "exitMenu");
    console.log("Exiting DBCM");
  } catch (err) {
    throw new VError(err, "Main loop error");
  }
}

main()
  .catch(err => {
    console.error(err.message);
  });
