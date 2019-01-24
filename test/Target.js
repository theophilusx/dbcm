"use strict";

const VError = require("verror");
const expect = require("chai").expect;
const should = require("chai").should();
const Target = require("../src/Target");

describe("Test Target object", function() {
  describe("Test object creation", function() {
    it("Create invalid object throws exception", function() {
      (function() {
        new Target();
      }).should.throw(VError, /Missing arguments/);
    });
    it("Create valid object with defaults", function() {
      expect(new Target("name", "db", "user", "pwd")).to.be.an("object");
    });
    it("Create valid object without defaults", function() {
      expect(new Target("n", "db", "u", "pwd", "h", 1)).to.be.an("object");
    });
  });

  describe("Test Target has correct properties", function() {
    it("Object with all properties and defaults", function() {
      let t = new Target("n", "d", "u", "p");
      expect(t).to.have.all.keys(
        "name",
        "database",
        "host",
        "port",
        "user",
        "password"
      );
      expect(t).to.include({
        name: "n",
        database: "d",
        host: "localhost",
        port: 5432,
        user: "u",
        password: "p"
      });
    });
    it("Object with all properties and no defaults", function() {
      let t = new Target("n", "d", "u", "p", "l", 1);
      expect(t).to.have.all.keys(
        "name",
        "database",
        "host",
        "port",
        "user",
        "password"
      );
      expect(t).to.include({
        name: "n",
        database: "d",
        host: "l",
        port: 1,
        user: "u",
        password: "p"
      });
    });
  });

  describe("Test Target methods", function() {
    let t = new Target(
      "testName",
      "testDb",
      "testUser",
      "testPwd"
    );
    it("Test params() method", function() {
      expect(t.params()).to.deep.equal({
        database: "testDb",
        host: "localhost",
        port: 5432,
        user: "testUser",
        password: "testPwd"
      });
    });
  });
});



