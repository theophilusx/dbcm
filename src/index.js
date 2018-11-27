"use strict";

const appName = "dbcm";

const path = require("path");
const git = require("./git");
const repoui = require("./repoUI");
const configui = require("./configUI");
const fse = require("fse");

const rcPath = path.join(process.env.HOME, ".dbcmrc");
const appState = new Map();

let config = {};

async function readConfig() {
  try {
    await fse.access(path.join(rcPath), fse.constants.R_OK | fse.constants.W_OK);
    let config = await fse.readJson(rcPath);
    return config;
  } catch (err) {
    if (err.code === "ENOENT") {
      console.log("WARNING: No .dbcmrc config file found");
      return {};
    }
    throw new Error(err.message);
  }
}

async function main() {
  let finished = false;

  try {
    config = await readConfig();
    if (Object.keys(config).length === 0) {
      config = await configui.getConfig({});
      console.log(`Config 2 = ${JSON.stringify(config, null, " ")}`);
      await configui.writeConfig(config);
    }
    while (!finished) {
      let repoAnswer = await repoui.selectRepository(config);
      if (repoAnswer.repository === "Quit DBCM") {
        finished = true;
        continue;
      } else if (repoAnswer.repository === "Add new database") {
        appState.set("repositoryName", repoAnswer.newName);
        appState.set("repositoryURL", repoAnswer.repoURL);
        if (!config.dbRepositories) {
          config.dbRepositories = {};
        }
        config.dbRepositories[repoAnswer.newName] = repoAnswer.repoURL;
        await configui.writeConfig(config);
      } else {
        appState.set("repositoryName", repoAnswer.repository);
        appState.set("repositoryURL", config.dbRepositories[repoAnswer.repository]);
      }
      let localPath = path.join(config.dbcmHome, appState.get("repositoryName"));
      let repo = await git.setupRepository(appState.get("repositoryURL"), localPath);
      // finish here for now
      finished = true;
      continue;
    }
    console.log("Exiting DBCM");
  } catch (err) {
    throw new Error(err.message);
  }
}

// git.setupRepository(repoUrl, path.join(config.dbcmHome, repoName))
//   .then(repoObj => {
//     repo = repoObj;
//     console.log("All good");
//     return git.getReferenceNames(repo);
//   })
//   .then(refs => {
//     refs.forEach(r => console.log(`Reference: ${r}`));
//     return true;
//   })
//   .catch(err => {
//     console.error(err.message);
//   });


main()
  .catch(err => {
    console.error(err.message);
  });
