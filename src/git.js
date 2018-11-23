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

function getRepository(repoUrl, dst) {
  const logName = `${moduleName}.getRepository`;
  
  return Git.Clone(repoUrl, dst, cloneOptions)
    .then(repo => {
      return repo;
    })
    .catch(err => {
      if (err.errno === -4) {
        // looks like repo already there - try opening and pull
        console.log(`Repository ${dst} already exists`);
        return Git.Repository.open(dst)
          .catch(err => {
            throw new VError(err, `${logName} Failed to open repo ${dst}`);
          });
      }
      throw new VError(err, `${logName} Failed to clone ${repoUrl}`);
    });
}


function statusString(s) {
  let words = [];
  if (s.isConflicted()) {
    words.push("CONFLICT");
  }
  if (s.isDeleted()) {
    words.push("DELETED");
  }
  if (s.isIgnored()) {
    words.push("IGNORED");
  }
  if (s.isModified()) {
    words.push("MODIFIED");
  }
  if (s.isNew()) {
    words.push("NEW");
  }
  if (s.isRenamed()) {
    words.push("MOVED");
  }
  if (s.isTypechange()) {
    words.push("TYPECHANGE");
  }
  return `${words.join(" ")} ${s.path()} ${s.status()}`; 
}

function getReferenceNames(repo) {
  const logName = `${moduleName}.getReferences`;

  return repo.getReferenceNames(Git.Reference.TYPE.LISTALL)
    .then(names => {
      names.forEach(refName => {
        console.log(`Reference: ${refName}`);
      });
      return names;
    })
    .catch(err => {
      throw new VError(err, `${logName} Failed to get references`);
    });
}

function setupRepository(repoUrl, repoDest) {
  const logName = `${moduleName}.setupRepository`;
  let repo;
  return getRepository(repoUrl, repoDest)
    .then(r => {
      repo = r;
      return repo.getStatus();
    })
    .then(statusList => {
      if (statusList.length) {
        console.log("Uncommited changes exist in repository");
        statusList.forEach(f => console.log(statusString(f)));
      } else {
        console.log("Nothing needing to be committed - do pull");
      }
    })
    .then(() => {
      return getReferenceNames(repo);
    })
    .then(() => {
      return repo;
    })
    .catch(err => {
      throw new VError(err, `${logName} Failed to setup ${repoDest}`);
    });
}


module.exports = {
  statusString,
  getReferenceNames,
  setupRepository
};
