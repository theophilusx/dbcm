"use strict";

const VError = require("verror");
const expect = require("chai").expect;
const should = require("chai").should();
const AppState = require("../src/AppState");
const Repository = require("../src/Repository");
const RepositoryMap = require("../src/RepositoryMap");
const PlanMap = require("../src/PlanMap");
const Target = require("../src/Target");
const TargetMap = require("../src/TargetMap");

let testState;

describe("Test AppState", function() {
  describe("Create and initialise", function() {
    it("Create AppState object", function() {
      expect(new AppState()).to.be.an("object");
    });

    it("Object of right instance", function() {
      expect(new AppState() instanceof AppState).to.equal(true);
    });
  });

  describe("Initialise clean state tests", function() {
    before("Create base state object", function() {
      testState = new AppState();
    });

    it("Init without rc file", async function() {
      await testState.init();
      expect(testState.initialised).to.equal(true);
    });

    it("Init with missing rc file", async function() {
      await testState.init("./notExistrc");
      expect(testState.initialised).to.equal(true);
    });

    describe("Verify default values", function() {
      before("Create test state", async function() {
        testState = new AppState();
        await testState.init();
      });

      it("Undefined username", function() {
        expect(testState.username()).to.equal(undefined);
      });

      it("Undefined email", function() {
        expect(testState.email()).to.equal(undefined);
      });

      it("Undefined home", function() {
        expect(testState.home()).to.equal(undefined);
      });

      it("repositoryMap returns an instance of RepositoryMap", function() {
        expect(testState.repositoryMap() instanceof RepositoryMap).to.equal(true);
      });
      
      it("Empty repository list", function() {
        expect(testState.repositoryCount()).to.equal(0);
      });

      it("Current repository definition throws exception", function() {
        (function() {
          testState.currentRepositoryDef();
        }).should.throw(VError, /Current repository not defined/);
      });

      it("Current repository url trows exception", function() {
        (function() {
          testState.currentRepositoryUrl();
        }).should.throw(VError, /Current repository not defined/);
      });

      it("Current repository targets thows exception", function() {
        (function() {
          testState.currentRepositoryTargets();
        }).should.throw(VError, /Current repository not defined/);
      });


      it("Current target def throws exception", function() {
        (function() {
          testState.currentTargetDef();
        }).should.throw(
          VError,
          /Either current repository or current target is not defined/
        );
      });

      it("PsqlPath is undefined", function() {
        expect(testState.psqlPath()).to.equal(undefined);
      });

      it("Current approval type throws exception", function() {
        (function() {
          testState.currentApprovalType();
        }).should.throw(VError, /Current repository not defined/);
      });

      it("Current approvers throws exception", function() {
        (function() {
          testState.currentApprovers();
        }).should.throw(VError, /Current repository not defined/);
      });

      it("Change plans is a map", function() {
        expect(testState.changePlans()).to.be.an.instanceof(PlanMap);
      });

      it("Current plan is undefined", function() {
        expect(testState.currentPlanUUID()).to.equal(undefined);
      });

      
    });
  });

  describe("Test basic user settings", function() {
    before("Setup user data", async function() {
      testState = new AppState();
      await testState.init();
      testState.state.set("user", {
        name: "Johnny Thunders",
        email: "johnny@example.com"
      });
      testState.state.set("home", "/path/to/dbcm");
      testState.state.set("psqlPath", "/path/to/bin/psql");
    });

    it("Get username", function() {
      expect(testState.username()).to.equal("Johnny Thunders");
    });

    it("Get email", function() {
      expect(testState.email()).to.equal("johnny@example.com");
    });

    it("Get DBCM home", function() {
      expect(testState.home()).to.equal("/path/to/dbcm");
    });

    it("Get psql path", function() {
      expect(testState.psqlPath()).to.equal("/path/to/bin/psql");
    });
  });

  describe("Repository and target methods", function() {
    let repo, repoMap;
    let target;
    let url = "git@github.com:theophilusx/test-repo";
    
    before("Setup repostiory test data", async function() {
      testState = new AppState();
      await testState.init();
      testState.set("home", "/home");
      target = new Target("tst-targe", "tstdb", "tstuser", "tstpwd");
      repo = new Repository("test-repo", url, testState.home());
      repo.setTarget(target);
      repoMap = new RepositoryMap();
      repoMap.setRepo(repo);
    });

    it("Repositories returns RepositoryMap", function() {
      expect(testState.repositoryMap()).to.be.an.instanceof(RepositoryMap);
    });

    it("Set repositories", function() {
      testState.setRepositoryMap(repoMap);
      expect(testState.repositoryMap()).to.be.an.instanceof(RepositoryMap);
      expect(testState.repositoryCount()).to.equal(1);
    });

    it("Get current repository returns undefined", function() {
      expect(testState.currentRepositoryName()).to.equal(undefined);
    });

    it("Repository Def throws exception if not exist", function() {
      (function() {
        testState.currentRepositoryDef("not-exist");
      }).should.throw(VError, /Current repository not defined/);
    });
    
    it("Set current repository", function() {
      expect(testState.setCurrentRepositoryName(repo.name));
      expect(testState.currentRepositoryName()).to.equal(repo.name);
    });

    it("Get current repository returns repo name", function() {
      expect(testState.currentRepositoryName()).to.equal(repo.name);
    });

    it("Get repository def", function() {
      expect(testState.repository(repo.name)).to.deep.equal(repo);
    });

    it("Get current repository", function() {
      expect(testState.currentRepositoryDef()).to.deep.equal(repo);
    });

    it("Get current repo url", function() {
      expect(testState.currentRepositoryUrl()).to.equal(repo.url);
    });

    it("Get current repository targets", function() {
      expect(testState.currentRepositoryTargets()).to.be.instanceof(TargetMap);
    });

    it("Current target returns undefined", function() {
      expect(testState.currentTargetName()).to.equal(undefined);
    });

    it("Set current target", function() {
      testState.setCurrentTargetName(target.name);
      expect(testState.currentTargetName()).to.equal(target.name);
    });

    it("Get current target definition", function() {
      expect(testState.currentTargetDef()).to.be.an.instanceof(Target);
      expect(testState.currentTargetDef().name).to.equal(target.name);
    });
  });

  describe("Test approver methods", function() {
    let repo;
    let target;
    const url = "git@github.com:theophilusx/test-repo";
    
    before("Setup repostiory test data", async function() {
      testState = new AppState();
      await testState.init();
      testState.set("home", "/tmp");
      repo = new Repository("test-repo", url, testState.home());
      target = new Target("tst-targe", "tstdb", "tstuser", "tstpwd");
      repo.setTarget(target);
      testState.setRepository(repo);
    });

    it("Current approver type throws exception", function() {
      (function() {
        testState.currentApprovalType();
      }).should.throw(VError, /Current repository not defined/);
    });

    it("Current approver type returns none", function() {
      testState.setCurrentRepositoryName(repo.name);
      expect(testState.currentApprovalType()).to.equal("none");
    });

    it("Set approval type to all", function() {
      testState.setCurrentApprovalType("all");
      expect(testState.currentApprovalType()).to.equal("all");
    });

    it("Set approval type to any", function() {
      testState.setCurrentApprovalType("any");
      expect(testState.currentApprovalType()).to.equal("any");
    });

    it("Setting bad approval type throws exception", function() {
      (function() {
        testState.setCurrentApprovalType("foobar");
      }).should.throw(VError, /Invalid approval type/);
    });
    
  });
});
