"use strict";

const moduleName = "state";

const VError = require("verror");
const path = require("path");
const fse = require("fse");
const plans = require("./plans");
const approvals = require("./approvals");

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
          psqlPath: undefined,
          currentRepository: undefined,
          currentTarget: undefined,
          currentPlan: undefined
        };
      }
      throw new VError(err, `${logName} Failed to access ${rcPath}`);
    });
}


async function writeConfig(appState) {
  const logName = `${moduleName}.writeState`;
  let newConfig = {};

  try {
    newConfig.version = "1.0.0";
    newConfig.user = appState.get("user");
    newConfig.repositoryHome = appState.get("home");
    newConfig.psqlPath = appState.get("psqlPath");
    newConfig.currentRepository = appState.get("currentRepository");
    newConfig.currentTarget = appState.get("currentTarget");
    newConfig.currentPlan = appState.get("currentPlan");
    let repoList = [];
    let repoMap = appState.get("repositories");
    for (let repoName of repoMap.keys()) {
      let repo = repoMap.get(repoName);
      let url = repo.url;
      let targets = [];
      let targetMap = repo.targets;
      for (let targetName of targetMap.keys()) {
        let params = targetMap.get(targetName);
        targets.push({
          targetName: targetName,
          database: params.database,
          host: params.host,
          port: params.port,
          user: params.user,
          password: params.password
        });
      }
      repoList.push({
        name: repoName,
        url: url,
        targets: targets
      });
    }
    newConfig.repositories = repoList;
    await fse.writeFile(rcPath, JSON.stringify(newConfig, null, " "));
  } catch (err) {
    throw new VError(err, `${logName} Failed to write ${rcPath}`);
  }
}

async function createApplicationState() {
  const logName = `${moduleName}.createApplicationState`;
  const state = new Map();

  try {
    let config = await readConfig();
    state.set("user", config.user);
    state.set("home", config.repositoryHome);
    let repoMap = new Map();
    if (config.repositories.length) {
      for (let repo of config.repositories) {
        let targetMap = new Map();
        for (let t of repo.targets) {
          let targetName = t.targetName;
          let params = {
            database: t.database,
            host: t.host,
            port: t.port,
            user: t.user,
            password: t.password
          };
          targetMap.set(targetName, params);
        }
        repoMap.set(repo.name, {
          url: repo.url,
          targets: targetMap
        });
      }
    }
    state.set("repositories", repoMap);
    state.set("currentRepository", config.currentRepository);
    state.set("currentTarget", config.currentTarget);
    state.set("currentPlan", config.currentPlan);
    state.set("psqlPath", config.psqlPath);
    state.set("approvalType", "none");
    state.set("approvers", new Map());
    state.set("developmentPlans", new Map());
    state.set("pendingPlans", new Map());
    state.set("approvedPlans", new Map());
    state.set("menuChoice", "unknown");
    state.set("repoObject", undefined);
    return {
      get: key => {
        return state.get(key);
      },
      set: (key, value) => {
        return state.set(key, value);
      },
      username: () => {
        return state.get("user").name;
      },
      email: () => {
        return state.get("user").email;
      },
      home: () => {
        return state.get("home");
      },
      repositories: () => {
        return state.get("repositories");
      },
      setRepositories: repoMap => {
        return state.set("repositories", repoMap);
      },
      repositoryDef: repoName => {
        return state.get("repositories").get(repoName);
      },
      setRepositoryDef: (repoName, defObject) => {
        return state.get("repositories").set(repoName, defObject);
      },
      currentRepository: () => {
        return state.get("currentRepository");
      },
      setCurrentRepository: repoName => {
        return state.set("currentRepository", repoName);
      },
      currentRepositoryDef: () => {
        return state.get("repositories").get(state.get("currentRepository"));
      },
      currentRepositoryUrl: () => {
        if (state.get("currentRepository")) {
          return state.get("repositories").get(state.get("currentRepository")).url;
        } else {
          throw new VError(`${logName} current repository not defined`);
        }
      },        
      currentRepositoryTargets: () => {
        if (state.get("currentRepository")) {
          return state.get("repositories").get(state.get("currentRepository")).targets;
        } else {
          throw new VError(`${logName} current repository not defined`);
        }
      },
      setCurrentRepositoryTargets: targetMap => {
        if (state.get("currentRepository")) {
          state.get("repositories").get(state.get("currentRepository")).targets = targetMap; 
        } else {
          throw new VError(`${logName} Current repository not set`);
        }
      },
      currentTarget: () => {
        return state.get("currentTarget");
      },
      setCurrentTarget: targetName => {
        return state.set("currentTarget", targetName);
      },
      currentTargetDef: () => {
        if (state.get("currentRepository") && state.get("currentTarget")) {
          return state.get("repositories").get(state.get("currentRepository")).targets.get(state.get("currentTarget"));
        } else {
          throw new VError(`${logName} Both currentRepository and currentTarget need to be defined `
                           + `repo: ${state.get("currentRepository")} target: ${state.get("currentTarget")}`);
        }
      },
      psqlPath: () => {
        return state.get("psqlPath");
      },
      setPsqlPath: psql => {
        return state.set("psqlPath", psql);
      },
      approvalType: () => {
        return state.get("approvalType");
      },
      setApprovalType: type => {
        return state.set("approvalType", type);
      },
      approvers: () => {
        return state.get("approvers");
      },
      setApprovers: appMap => {
        return state.set("approvers", appMap);
      },
      developmentPlans: () => {
        return state.get("developmentPlans");
      },
      setDevelopmentPlans: planMap => {
        return state.set("developmentPlans", planMap);
      },
      pendingPlans: () => {
        return state.get("pendingPlans");
      },
      setPendingPlans: planMap => {
        return state.set("pendingPlans", planMap);
      },
      approvedPlans: () => {
        return state.get("approvedPlans");
      },
      setApprovedPlans: planMap => {
        return state.set("approvedPlans", planMap);
      },
      currentPlan: () => {
        return state.get("currentPlan") ? state.get("currentPlan") : "?:?:?";
      },
      setCurrentPlan: (type, name, id) => {
        return state.set("currentPlan", `${type}:${name}:${id}`);
      },
      menuChoice: () => {
        return state.get("menuChoice");
      },
      setMenuChoice: choice => {
        return state.set("menuChoice", choice);
      },
      writeConfigFile: async () => {
        const logName = `${moduleName}.writeConfigFile`;
        
        try {
          await writeConfig(state);
        } catch (err) {
          throw new VError(err, `${logName}`);
        }
      },
      dump: () => {
        console.dir(state); 
      }
    };
  } catch (err) {
    throw new VError(err, `${logName} Failed to initialise DBCM state`);
  }
}

module.exports = {
  createApplicationState
};
