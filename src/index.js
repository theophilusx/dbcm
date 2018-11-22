"use strict";

const appName = "dbcm";

const path = require("path");
const git = require("./git");
const config = require("rc")(appName);

const repoName = "casi-admin-db";
const repoUrl = config.dbRepositories[repoName];

git.cloneRepo(repoUrl, path.join(config.dbcmHome, repoName))
  .then(repo => {
    console.log("All good");
  })
  .catch(err => {
    console.error(err.message);
  });
