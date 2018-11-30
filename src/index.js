"use strict";

const VError = require("verror");
const path = require("path");
const git = require("./git");
const repoui = require("./repoUI");
const targetui = require("./targetUI");
const configui = require("./configUI");
const state = require("./state");
const plans = require("./plans");
const planui = require("./planUI");
const mainui = require("./mainUI");

let appState = new Map();

async function main() {
  let finished = false;
  let repo;

  try {
    appState = await state.setInitialState();
    if (!appState.get("user").name) {
      appState = await configui.getConfig(appState);
    }
    while (!finished) {
      console.log("call selectRepository");
      [appState, finished] = await repoui.selectRepository(appState);
      if (finished) {
        continue;
      }
      console.log("Setup repo");
      [appState, repo] = await git.setupRepository(appState);
      //appState.set("repoObject", repo);
      [appState, finished] = await targetui.selectTarget(appState);
      appState = await plans.initPlans(appState);
      let exitMain = false;
      while (!exitMain && !finished) {
        let newPlan;
        let choice = await mainui.mainMenu(appState);
        switch (choice) {
        case "exitProgram":
          exitMain = true;
          finished = true;
          continue;
        case "exitMenu":
          exitMain = true;
          continue;
        // case "newSet":
        //   console.log("Create new change set");
        //   newPlan = await planui.getPlanDetails(appState);
        //   if (newPlan) {
        //     appState = await plans.createChangePlan(appState, repo, newPlan);
        //   }
        //   break;
        default:
          console.log(`Unhandled menu option: ${choice}`);
        }
      }
      // finish here for now
    }
    console.log("Exiting DBCM");
  } catch (err) {
    throw new VError(err, `main: Error`);
  }
}

main()
  .catch(err => {
    console.error(err.message);
  });
