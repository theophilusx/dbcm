"use strict";

const VError = require("verror");
const expect = require("chai").expect;
const should = require("chai").should();
const {Repository} = require("../src/Repository");
const {Target} = require("../src/Target");

describe("Testing Repository object", function() {

  describe("Create Repository object", function() {
    it("Throw exception for missing args", function() {
      (function() {
        new Repository();
      }).should.throw(VError, /Missing arguments/);
    });

    it("Create an object", function() {
      expect(new Repository("repoName", "repoUrl")).is.an("object");
    });

    it("Object has right properties", function() {
      expect(new Repository("name", "aUrl")).has.all.keys(
        "name",
        "url",
        "approvalType",
        "approvers",
        "targets",
        "repo"
      );
    });
  });

  describe("Test Repository correctness", function() {
    let r = new Repository("name", "aUrl");

    it("Name correct", function() {
      expect(r.name).to.equal("name");
    });

    it("URL correct", function() {
      expect(r.url).to.equal("aUrl");
    });

    it("Approval type", function() {
      expect(r.approvalType).to.equal("none");
    });

    it("Approvers is a map", function() {
      expect(r.approvers).is.a("map");
    });

    it("Targets is an object", function() {
      expect(r.targets).is.an("object");
    });
  });

  describe("Test repository methods", function() {
    let r = new Repository("name", "aUrl");  
    let approvers = [{
      name: "John Doe",
      email: "johnd@example.com"
    },
    {
      name: "Jane Dough",
      email: "janed@example.com"
    }];

    describe("Setting approval type", function() {
      it("Bad approver type throws error", function() {
        (function() {
          r.setApprovalType("fred");
        }).should.throw(VError, /Unknown approval type of fred/);
      });

      it("Set approval type to none", function() {
        r.setApprovalType("none");
        expect(r.approvalType).to.equal("none");
      });

      it("Set approval type to all", function() {
        r.setApprovalType("all");
        expect(r.approvalType).to.equal("all");
      });

      it("Set approval type to any", function() {
        r.setApprovalType("any");
        expect(r.approvalType).to.equal("any");
      });
    });

    describe("Setting approvers", function() {
      it("Non-array argument", function() {
        r.setApprovers("foo");
        expect(r.approvers.size).to.equal(2);
      });

      it("Empty array argument", function() {
        r.setApprovers([]);
        expect(r.approvers.size).to.equal(2);
      });

      it("Objects with bad properties", function() {
        (function() {
          r.setApprovers([{foo: "foo", bar: "bar"}]);      
        }).should.throw(VError, /Missing properties/);
      });

      it("Add approvers", function() {
        r.setApprovers(approvers);
        expect(r.approvers.size).to.equal(2);
      });
    });

    describe("Check for approvers", function() {
      r.setApprovers(approvers);

      it("False for non approver", function() {
        expect(r.isApprover("bill@example.com")).to.equal(false);
      });

      it("True for JaneD", function() {
        expect(r.isApprover("janed@example.com")).to.equal(true);
      });

      it("True for johnd", function() {
        expect(r.isApprover("johnd@example.com")).to.equal(true);
      });

      it("Test with undefined arg", function() {
        expect(r.isApprover()).to.equal(false);
      });
    });

    describe("Get approvers", function() {
      it("Undefined arg", function() {
        expect(r.getApprover()).to.equal(undefined);
      });

      it("Non existent approver", function() {
        expect(r.getApprover("bill@example.com")).to.equal(undefined);
      });

      it("Existing approver", function() {
        expect(r.getApprover("johnd@example.com")).to.be.an("object");
        expect(r.getApprover("johnd@example.com")).to.include.all.keys(
          "name",
          "email"
        );
        expect(r.getApprover("johnd@example.com")).to.deep.equal(approvers[0]);
      });
    });

    describe("Approver list", function() {
      it("Returns array", function() {
        expect(r.approverList()).to.be.an("array");
      });

      it("Returns array of 2 elements", function() {
        expect(r.approverList().length).to.equal(2);
      });

      it("Returns correct data", function() {
        expect(r.approverList()).to.deep.equal(approvers);
      });
    });

    describe("Target methods", function() {
      let t1 = new Target("name1", "db1", "user1", "pwd1");
      let t2 = new Target("name2", "db2", "user2", "pwd2");

      describe("set target", function() {
        it("Set with undefined target throws exception", function() {
          (function() {
            r.setTarget();
          }).should.throw(VError, /Argument must be an instance of Target/);
        });

        it("Set 2 targets", function() {
          r.setTarget(t1);
          r.setTarget(t2);
          expect(r.targets.size()).to.equal(2);
        });
      });

      describe("get target", function() {
        it("Returns undefined for non-existent key", function() {
          expect(r.getTarget("notExist")).to.equal(undefined);
        });

        it("Returns correct object for defined key", function() {
          expect(r.getTarget("name1")).to.deep.equal(t1);
        });
      });

      describe("target names", function() {
        it("Returns an array", function() {
          expect(r.targetNames()).to.be.an("array");
        });

        it("Array has correct number of elements", function() {
          expect(r.targetNames().length).to.equal(2);
        });
      });

      describe("get target params", function() {
        it("Returns undefined for non-existent key", function() {
          expect(r.getTargetParams("natExist")).to.equal(undefined);
        });
      
        it("Returns an object for existing key", function() {
          expect(r.getTargetParams("name1")).to.be.an("object");
        });

        it("Returned object has correct values", function() {
          expect(r.getTargetParams("name1")).to.deep.equal(t1.params());
        });
      });

      describe("Initialise from array", function() {
        let b1 = new Target("bname1", "bdb1", "buser1", "bpwd1");
        let b2 = new Target("bname2", "bdb2", "buser2", "bpwd2");

        it("init with empty array", function() {
          r.initTargets([]);
          expect(r.targets.size()).to.equal(0);
        });

        it("init with non-empty array", function() {
          r.initTargets([b1, b2]);
          expect(r.targets.size()).to.equal(2);
        });
      });

      describe("toObject method", function() {
        it("Returns an object", function() {
          expect(r.toObject()).to.be.an("object");
        });

        it("Object has correct properties", function() {
          expect(r.toObject()).to.include.all.keys(
            "name",
            "url",
            "targets"
          );
        });
      });
    });
  });
});



