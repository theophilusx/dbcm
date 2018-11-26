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

/**
 * @async
 *
 * Returns an open Repository object. If repository does not exit
 * it will be cloned from the remote repository and opened.
 * If it does exist, it will just be opened and the object returned
 *
 * @param {string} repoUrl - URL of the remote Git repository.
 * @param {string} dst - local destination for the repository.
 *
 * @return {Object} repo - a repository object
 * 
 */
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

/**
 * @async
 *
 * Perform a pull i.e. fetch and merge into the local master branch
 *
 * @param {Object} repo - an open Repository object.
 *
 * @return {boolean} Returns true if pull successful 
 *
 */
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

/**
 * Generates a status string for objects which are new, modified etc
 * Similar to the git status command
 *
 * @param {Object} s - a file status object as returned from getStatus()
 *
 * @return {string} a status string with status and file path
 * 
 */
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

/**
 * @async
 *
 * Return a list of reference names
 *
 * @param {Object} repo - a Repository object.
 *
 * @return {array} list of reference names
 * 
 */
function getReferenceNames(repo) {
  const logName = `${moduleName}.getReferences`;

  return repo.getReferenceNames(Git.Reference.TYPE.LISTALL)
    .then(names => {
      return names;
    })
    .catch(err => {
      throw new VError(err, `${logName} Failed to get references`);
    });
}

/**
 * @async
 *
 * Create a new branch. Throw and exception if the branch already exists.
 * New branch will be made from current HEAD.
 *
 * @param {Object} repo - a Repository object.
 * @param {String} branchName - name for the new branch
 *
 * @return {Object} reference to the new branch.
 * 
 */
function createBranch(repo, branchName) {
  const logName = `${moduleName}.createBranch`;

  return repo.getHeadCommit()
    .then(commit => {
      return repo.createBranch(branchName, commit, 0);
    })
    .catch(err => {
      throw new VError(err, `${logName} Failed to create branch ${branchName}`);
    });
}

/**
 * @async
 *
 * Delete a repository. This function will first checkout the master
 * branch and then delete the nominated branch.
 *
 * @param {Object} repo - a Repository object
 * @param {String} branchName - name of branch to delete.
 *
 * @return {boolean} Return true on success - false otherwise
 * 
 */
function deleteBranch(repo, branchName) {
  const logName = `${moduleName}.deleteBranch`;

  return repo.checkoutBranch("master")
    .then(() => {
      return Git.Branch.lookup(repo, branchName, Git.Branch.BRANCH.LOCAL);
    })
    .then(ref => {
      return Git.Branch.delete(ref);
    })
    .then(code => {
      if (code === 0) {
        console.log("Branch deleted");
        return true;
      } else {
        console.log(`Failed to delete branch: ${code}`);
        return false;
      }
    })
    .catch(err => {
      throw new VError(err, `${logName} Failed to delete branch`);
    });
}

/**
 * @async
 *
 * Add (stage) and commit the list of changed objects (files) to
 * a specific branch in a repository
 *
 * @param {Object} repo - a Repository object.
 * @param {String} branch - the branch name.
 * @param {Array} files - a list of file status objects.
 * 
 */
function addAndCommit(repo, branch, files) {
  const logName = `${moduleName}.addAndCommit`;
  let index, oid;
  
  return repo.checkoutBranch(branch)
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

/**
 * @async
 *
 * Setup a repository for DBCM. If teh repository has not yet been
 * cloned locally, do the cloning, then open it. If the repository has
 * uncommitted changes, display them. Do a refresh from master into
 * local master by performing a pull
 */
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
      }
      return pullMaster(repo);
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
  createBranch,
  deleteBranch,
  addAndCommit,
  setupRepository
};
