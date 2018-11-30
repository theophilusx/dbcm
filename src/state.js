"use strict";

const moduleName = "state";

const VError = require("verror");
const path = require("path");
const fse = require("fse");

const rcPath = path.join(process.env.HOME, ".dbcmrc");

function readConfig() {
  const logName = `${moduleName}.readConfig`;

  return fse.access(path.join(rcPath), fse.constants.R_OK | fse.constants.W_OK)
    .then(() => {
      return fse.readJson(rcPath);
    })
    .catch(err => {
      if (err.code === "ENOENT") {
        // no rc file - return default 
        return {
          version: "1.0.0",
          user: {
            name: undefined,
            email: undefined
          },
          repositoryHome: undefined,
          repositories: [],
          targets: [],
          psqlPath: undefined
        };
      }
      throw new VError(err, `${logName} Failed to access ${rcPath}`);
    });
}

async function setInitialState() {
  const logName = `${moduleName}.setInitialState`;
  const appState = new Map();

  try {
    console.log("read config file");
    let config = await readConfig();
    console.log("set basic appState values");
    appState.set("user", config.user);
    appState.set("version", config.version);
    appState.set("home", config.repositoryHome);
    console.log("Set repository data");
    let repoMap = new Map();
    if (config.repositories.length) {
      for (let repo of config.repositories) {
        repoMap.set(repo.name, repo.url);
      }
    }
    appState.set("repositories", repoMap);
    console.log("Set target data");
    let targetMap = new Map();
    if (config.targets.length) {
      for (let target of config.targets) {
        targetMap.set(target.name, target.parameters);
      }
    }
    appState.set("targets", targetMap);
    console.log("Set some defaults");
    appState.set("currentRepository", undefined);
    appState.set("currentTarget", undefined);
    appState.set("psqlPath", config.psqlPath);
    appState.set("approvalType", "none");
    appState.set("approvers", new Map());
    appState.set("developmentPlans", new Map());
    appState.set("pendingPlans", new Map());
    appState.set("approvedPlans", new Map());
    return appState;
  } catch (err) {
    throw new VError(err, `${logName} Failed to initialise DBCM state`);
  }
}

async function writeConfig(appState) {
  const logName = `${moduleName}.writeState`;
  let newConfig = {};

  try {
    newConfig.version = appState.get("version");
    newConfig.user = appState.get("user");
    newConfig.repositoryHome = appState.get("home");
    newConfig.psqlPath = appState.get("psqlPath");
    let repoList = [];
    let repoMap = appState.get("repositories");
    for (let repo of repoMap.keys()) {
      repoList.push({
        name: repo,
        url: repoMap.get(repo)
      });
    }
    newConfig.repositories = repoList;
    let targetList = [];
    let targetMap = appState.get("targets");
    for (let target of targetMap.keys()) {
      targetList.push({
        name: target,
        parameters: targetMap.get(target)
      });
    }
    newConfig.targets = targetList;
    await fse.writeFile(rcPath, JSON.stringify(newConfig, null, " "));
  } catch (err) {
    throw new VError(err, `${logName} Failed to write ${rcPath}`);
  }
}

module.exports = {
  setInitialState,
  writeConfig
};
