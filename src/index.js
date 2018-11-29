"use strict";

const path = require("path");
const git = require("./git");
const repoui = require("./repoUI");
const targetui = require("./targetUI");
const configui = require("./configUI");
const state = require("./state");
const plans = require("./plans");
const planui = require("./planUI");
const files = require("./files");

let appState = new Map();

async function main() {
  let finished = false;

  try {
    appState = await state.setInitialState();
    if (!appState.get("user").name) {
      appState = await configui.getConfig(appState);
    }
    while (!finished) {
      [appState, finished] = await repoui.selectRepository(appState);
      if (finished) {
        continue;
      }
      let repositories = appState.get("repositories");
      let repoName = appState.get("currentRepository");
      let localPath = path.join(appState.get("home"), repoName);
      let repo = await git.setupRepository(repositories.get(repoName), localPath);
      //appState.set("repoObject", repo);
      [appState, finished] = await targetui.selectTarget(appState);
      appState = await plans.initPlans(appState);
      let newPlan = await planui.getPlanDetails(appState);
      if (newPlan) {
        appState = await plans.createChangePlan(appState, repo, newPlan);
      }
      // finish here for now
      console.dir(appState);
      finished = true;
      continue;
    }
    console.log("Exiting DBCM");
  } catch (err) {
    throw new Error(err.message);
  }
}

main()
  .catch(err => {
    console.error(err.message);
  });
