"use strict";

const VError = require("verror");
const expect = require("chai").expect;
const should = require("chai").should();
const Repository = require("../src/Repository");
const RepositoryMap = require("../src/RepositoryMap");

describe("Testing RepositoryMap object", function() {
  let r1 = new Repository("name1", "url1");
  let r2 = new Repository("name2", "url2");
  let rm = new RepositoryMap();

  describe("Object construction", function() {
    it("Creates an object", function() {
      expect(new RepositoryMap()).to.be.an("object");
    });

    it("Object has repositories property", function() {
      expect(new RepositoryMap()).to.include.key("repositories");
    });

    it("Repositories property is a map", function() {
      expect(new RepositoryMap().repositories).to.be.a("map");
    });
  });

  describe("Set repository", function() {
    it("Set with undefined arg throws exception", function() {
      (function() {
        rm.setRepo();
      }).should.throw(VError, /Argument must be an instance of Repository/);
    });

    it("Set with wrong object type", function() {
      (function() {
        rm.setRepo({a: 1, b: 2});
      }).should.throw(VError, /Argument must be an instance of Repository/);
    });

    it("Add a repository", function() {
      rm.setRepo(r1);
      rm.setRepo(r2);
      expect(rm.repositories.size).to.equal(2);
    });
  });

  describe("Get repository", function() {
    it("Called without argument returns undefined", function() {
      expect(rm.getRepo()).to.equal(undefined);
    });

    it("Called with non-existent key returns undefined", function() {
      expect(rm.getRepo("notExist")).to.equal(undefined);
    });

    it("Called with existing key returns object", function() {
      expect(rm.getRepo("name1")).to.be.an("object");
    });

    it("Returned object is a Repository", function() {
      expect(rm.getRepo("name1") instanceof Repository).to.equal(true);
    });

    it("Repository returned equal repostiory added", function() {
      expect(rm.getRepo("name1")).to.deep.equal(r1);
    });
  });

  describe("toArray method", function() {
    it("Convert to array", function() {
      expect(rm.toArray()).to.be.an("array");
    });

    it("Returned array has correct number of elements", function() {
      expect(rm.toArray().length).to.equal(2);
    });

    it("Array contains objects", function() {
      expect(rm.toArray()[0]).to.be.an("object");
    });

  });
});
