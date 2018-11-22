"use strict";

const moduleName = "git";

const VError = require("verror");
const Git = require("nodegit");


const cloneOptions = {
  fetchOpts : {
    callbacks: {
      // This is a required callback for OS X machines.  There is a known issue
      // with libgit2 being able to verify certificates from GitHub.
      certificateCheck: function() { return 1; },
      // Credentials are passed two arguments, url and username. We forward the
      // `userName` argument to the `sshKeyFromAgent` function to validate
      // authentication.
      credentials: function(url, userName) {
        return Git.Cred.sshKeyFromAgent(userName);
      }
    }
  } 
};

function cloneRepo(repoUrl, dst) {
  const logName = `${moduleName}.cloneRepo`;
  
  return Git.Clone(repoUrl, dst, cloneOptions)
    .then(repo => {
      console.dir(repo);
      return repo;
    })
    .catch(err => {
      throw new VError(err, `${logName} Failed to clone ${repoUrl}`);
    });
}

module.exports = {
  cloneRepo 
};
