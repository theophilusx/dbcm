"use strict";

const moduleName = "edit";

const VError = require("verror");
const { execFile } = require("child_process");

function editFiles(files) {
  const logName = `${moduleName}.editFiles`;

  const child = execFile("open", files, (err, stdout, stderr) => {
    if (err) {
      throw new VError(err, `${logName} Error opening files for editing`);
    }
    console.log("Editor STDOUT: ", stdout);
    console.log("Editor STDERR: ", stderr);
  });
}

module.exports = {
  editFiles
};

