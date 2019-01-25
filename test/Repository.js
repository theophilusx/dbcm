"use strict";

const VError = require("verror");
const expect = require("chai").expect;
const should = require("chai").should();
const Repository = require("../src/Repository");
const Target = require("../src/Target");
const TargetMap = require("../src/TargetMap");

let testRepo, testRepo2;
let testApprovers;
let testTarget1, testTarget2;

function initTestRepo() {
  testRepo = new Repository("testRepoName", "testRepoUrl", "/tmp");
  testRepo2 = new Repository("testRepoName2", "testRepoUrl2", "/tmp");
}

function initTestApprovers() {
  testApprovers = [{
    name: "John Doe",
    email: "johnd@example.com"
  },
  {
    name: "Jane Dough",
    email: "janed@example.com"
  }];
}

function initTestTargets() {
  testTarget1 = new Target("targetName1", "db1", "user1", "pwd1");
  testTarget2 = new Target("targetName2", "db2", "user2", "pwd2");
}

describe("Testing Repository object", function() {
  
  describe("Create Repository object", function() {
    it("Create an object", function() {
      expect(new Repository("repoName", "repoUrl", "/tmp")).is.an("object");
    });

    it("Object has right properties", function() {
      expect(new Repository("name", "aUrl", "/tmp")).has.all.keys(
        "name",
        "url",
        "path",
        "releaseTag",
        "approvalType",
        "approvers",
        "targets",
        "gitRepo"
      );
    });
  });

  describe("Test Repository correctness", function() {
    before("Setup test repository", function() {
      initTestRepo();
    });
    
    it("Name correct", function() {
      expect(testRepo.name).to.equal("testRepoName");
    });

    it("URL correct", function() {
      expect(testRepo.url).to.equal("testRepoUrl");
    });

    it("Approval type", function() {
      expect(testRepo.approvalType).to.equal("none");
    });

    it("Approvers is a map", function() {
      expect(testRepo.approvers).is.a("map");
    });

    it("Targets is a TargetMap object", function() {
      expect(testRepo.targets instanceof TargetMap).to.equal(true);
    });
  });

  describe("Test repository methods", function() {
    before("initialise repo and approvers", function() {
      initTestRepo();
      initTestApprovers();      
    });
    
    describe("Setting approval type", function() {
      it("Bad approver type throws error", function() {
        (function() {
          testRepo.setApprovalType("fred");
        }).should.throw(VError, /Invalid approval type/);
      });

      it("Set approval type to none", function() {
        testRepo.setApprovalType("none");
        expect(testRepo.approvalType).to.equal("none");
      });

      it("Set approval type to all", function() {
        testRepo.setApprovalType("all");
        expect(testRepo.approvalType).to.equal("all");
      });

      it("Set approval type to any", function() {
        testRepo.setApprovalType("any");
        expect(testRepo.approvalType).to.equal("any");
      });
    });

    describe("Setting approvers", function() {
      it("Non-array argument", function() {
        testRepo.setApprovers("foo");
        expect(testRepo.approvers.size).to.equal(0);
      });

      it("Empty array argument", function() {
        testRepo.setApprovers([]);
        expect(testRepo.approvers.size).to.equal(0);
      });

      it("Objects with bad properties", function() {
        (function() {
          testRepo.setApprovers([{foo: "foo", bar: "bar"}]);      
        }).should.throw(VError, /Missing properties/);
      });

      it("Add approvers", function() {
        testRepo.setApprovers(testApprovers);
        expect(testRepo.approvers.size).to.equal(2);
      });
    });

    describe("Check for approvers", function() {
      it("False for non approver", function() {
        expect(testRepo.isApprover("bill@example.com")).to.equal(false);
      });

      it("True for existing key", function() {
        expect(testRepo.isApprover("janed@example.com")).to.equal(true);
      });

      it("Test with undefined arg", function() {
        expect(testRepo.isApprover()).to.equal(false);
      });
    });

    describe("Get approvers", function() {
      it("Undefined arg", function() {
        expect(testRepo.getApprover()).to.equal(undefined);
      });

      it("Non existent approver", function() {
        expect(testRepo.getApprover("bill@example.com")).to.equal(undefined);
      });

      it("Existing approver returns object", function() {
        expect(testRepo.getApprover("johnd@example.com")).to.be.an("object");

      });

      it("Returned object has correct properties", function() {
        expect(testRepo.getApprover("johnd@example.com")).to.include.all.keys(
          "name",
          "email"
        );
      });

      it("Returned object has same values as init object", function() {
        expect(testRepo.getApprover("johnd@example.com")).to.deep.equal(testApprovers[0]); 
      });
    });

    describe("Approver list", function() {
      it("Returns array", function() {
        expect(testRepo.approverList()).to.be.an("array");
      });

      it("Returns array of 2 elements", function() {
        expect(testRepo.approverList().length).to.equal(2);
      });

      it("Returns correct data", function() {
        expect(testRepo.approverList()).to.deep.equal(testApprovers);
      });
    });

    describe("Target methods", function() {
      before("Initialise repo and targets", function() {
        initTestRepo();
        initTestTargets();
      });
      
      describe("set target", function() {
        it("Set with undefined target throws exception", function() {
          (function() {
            testRepo.setTarget();
          }).should.throw(VError, /Argument must be an instance of Target/);
        });

        it("Set 2 targets", function() {
          testRepo.setTarget(testTarget1);
          testRepo.setTarget(testTarget2);
          expect(testRepo.targets.size()).to.equal(2);
        });
      });

      describe("get target", function() {
        it("Returns undefined for non-existent key", function() {
          expect(testRepo.getTarget("notExist")).to.equal(undefined);
        });

        it("Returns correct object for defined key", function() {
          expect(testRepo.getTarget("targetName1")).to.deep.equal(testTarget1);
        });
      });

      describe("target names", function() {
        it("Returns an array", function() {
          expect(testRepo.targetNames()).to.be.an("array");
        });

        it("Array has correct number of elements", function() {
          expect(testRepo.targetNames().length).to.equal(2);
        });
      });

      describe("get target params", function() {
        it("Returns undefined for non-existent key", function() {
          expect(testRepo.getTargetParams("natExist")).to.equal(undefined);
        });
      
        it("Returns an object for existing key", function() {
          expect(testRepo.getTargetParams("targetName1")).to.be.an("object");
        });

        it("Returned object has correct values", function() {
          expect(testRepo.getTargetParams("targetName2")).to.deep.equal(testTarget2.params());
        });
      });

      describe("Initialise from array", function() {
        let b1 = new Target("bname1", "bdb1", "buser1", "bpwd1");
        let b2 = new Target("bname2", "bdb2", "buser2", "bpwd2");

        it("init with empty array", function() {
          testRepo.initTargets([]);
          expect(testRepo.targets.size()).to.equal(0);
        });

        it("init with non-empty array", function() {
          testRepo.initTargets([b1, b2]);
          expect(testRepo.targets.size()).to.equal(2);
        });
      });
    });

  });

  describe("Convert to/from object", function() {
    before("Initialise repo and targets", function() {
      initTestRepo();
      initTestTargets();
      testRepo.setTarget(testTarget1);
      testRepo.setTarget(testTarget2);
    });

    describe("toObject method", function() {
      it("Returns an object", function() {
        expect(testRepo.toObject()).to.be.an("object");
      });

      it("Object has correct properties", function() {
        expect(testRepo.toObject()).to.include.all.keys(
          "name",
          "url",
          "targets"
        );
      });
    });

    describe("fromObject method", function() {
      it("Initialised repo has correct name", function() {
        let repObj = testRepo.toObject();
        testRepo2.fromObject(repObj);
        expect(testRepo2.name).to.equal(testRepo.name);
      });

      it("Initialised repo has correct URL", function() {
        expect(testRepo2.url).to.equal(testRepo.url);        
      });

      it("Initialised repo has correct targets", function() {
        expect(testRepo2.targets.toArray()).to.deep.equal(testRepo.targets.toArray());        
      });
    });
  });
});



