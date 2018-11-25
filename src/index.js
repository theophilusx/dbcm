"use strict";

const appName = "dbcm";

const path = require("path");
const git = require("./git");
const config = require("rc")(appName);

const repoName = "casi-admin-db";
const repoUrl = config.dbRepositories[repoName];


git.setupRepository(repoUrl, path.join(config.dbcmHome, repoName))
  .then(repo => {
    console.log("All good");
    return git.getReferenceNames(repo);
  })
  .then(refs => {
    refs.forEach(r => console.log(`Reference: ${r}`));
  })
  .catch(err => {
    console.error(err.message);
  });
