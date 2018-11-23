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

function pullMaster(repo) {
  const logName = `${moduleName}.pullMaster`;

  return repo.fetchAll(cloneOptions.fetchOpts)
    .then(() => {
      repo.mergeBranches("master", "origin/master");
    })
    .then(() => {
      console.log("Updated local master with fresh pull from remote");
    })
    .catch(err => {
      throw new VError(err, `${logName} Failed to pull master`);
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

function addAndCommit(repo, files) {
  const logName = `${moduleName}.addAndCommit`;
  let index, oid;
  
  return repo.checkoutBranch("dbcm-local")
    .then(() => {
      return repo.refreshIndex();
    })
    .then(idx => {
      let promises = [];
      index = idx;
      files.forEach(f => {
        promises.push(index.addByPath(f.path()));
      });
      return Promise.all(promises);
    })
    .then(() => {
      return index.write();
    })
    .then(() => {
      return index.writeTree();
    })
    .then((newOid) => {
      oid = newOid;
      return Git.Reference.nameToId(repo, "HEAD");
    })
    .then(head => {
      return repo.getCommit(head);
    })
    .then(parent => {
      let author = Git.Signature.now("Some Author", "author@example.com");
      let committer = Git.Signature.now("Some Committer", "committer@exaple.com");
      let msg = "Initial setup";
      return repo.createCommit("HEAD", author, committer, msg, oid, [parent]);
    })
    .catch(err => {
      throw new VError(err, `${logName} Failed to commit changes`);
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
        return addAndCommit(repo, statusList)
          .then(() => {
            return pullMaster(repo);
          });
      } else {
        console.log("Nothing needing to be committed - do pull");
      }
      return pullMaster(repo);
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
  pullMaster,
  statusString,
  getReferenceNames,
  setupRepository
};
