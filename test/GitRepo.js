"use strict";

const VError = require("verror");
const path = require("path");
const chai = require("chai");
const expect = require("chai").expect;
const should = require("chai").should();
const GitRepo = require("../src/GitRepo");
const fse = require("fse");
const chaiAsPromised = require("chai-as-promised");

chai.use(chaiAsPromised);

describe("Test GitRepo Object", function() {
  describe("Test object creation", function() {
    it("Returns instance of GitRepo", function() {
      expect(new GitRepo("repoName", "repoUrl", "repoRoot"))
        .is.an.instanceof(GitRepo);
    });
    describe("Missing arguments thows exception", function() {
      it("Missing arguments throws exception", function() {
        (function() {
          new GitRepo();
        }).should.throw(VError, /Must provide a repository name, url and local path/);
      });
      it("Missing url and root arguments throws exception", function() {
        (function() {
          new GitRepo("testRepo");
        }).should.throw(VError, /Must provide a repository name, url and local path/);
      });
      it("Missing root argument throws exception", function() {
        (function() {
          new GitRepo("testRepo", "testurl");
        }).should.throw(VError, /Must provide a repository name, url and local path/);
      });
    });
  });
  describe("Test repo initialisation", function() {
    let testRepo;
    const name = "test-name";
    const url = "git@github.com:theophilusx/test-repo";
    const root = "/home/tim/dbcm";
    
    before("Setup test repo", function() {
      testRepo = new GitRepo(name, url, root);
    });
    after("Cleanup after test", async function() {
      try {
        await fse.rmdir(path.join(root, name));        
      } catch (err) {
        return;
      }
    });
    
    it("test initial state", function() {
      expect(testRepo.name).to.equal(name);
      expect(testRepo.url).to.equal(url);
      expect(testRepo.path).to.equal(path.join(root, name));
      expect(testRepo.repoObj).to.equal(undefined);
    });
    it("Clone repo test", async function() {
      return expect(testRepo.init()).to.be.fulfilled;
    });
    it("Existing repo test pull", function() {
      return expect(testRepo.init()).to.be.fulfilled;
    });
    
  });
});
