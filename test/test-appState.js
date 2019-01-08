"use strict";

const VError = require("verror");
const expect = require("chai").expect;
const should = require("chai").should();
const {AppState} = require("../src/AppState");
const {RepositoryMap} = require("../src/RepositoryMap");

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

      it("Repositories list is instance of RepositoryMap", function() {
        expect(testState.repositories() instanceof RepositoryMap).to.equal(true);
      });
      
      it("Empty repository list", function() {
        expect(testState.repositoryCount()).to.equal(0);
      });

      it("Current repository throws an exception", function() {
        (function() {
          testState.currentRepository();
        }).should.throw(VError, /Current repository not defined/);
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

      it("Current target throws exception", function() {
        (function() {
          testState.currentTarget();
        }).should.throw(VError, /Current target not defined/);
      });

      it("Current target def throws exception", function() {
        (function() {
          testState.currentTargetDef();
        }).should.throw(VError, /Either current repository or current target is not defined/);
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

      
    });
  });
});
