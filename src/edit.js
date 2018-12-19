"use strict";

const moduleName = "edit";

const VError = require("verror");
const { execFile } = require("child_process");
const screen = require("./textScreen");

function editFiles(files) {
  const logName = `${moduleName}.editFiles`;

  const child = execFile("open", files, (err, stdout, stderr) => {
    if (err) {
      throw new VError(err, `${logName} Error opening files for editing`);
    }
    if (stderr.length) {
      console.log(`${logName} ${stderr}`);
    }
  });
}

function viewFiles(files) {
  const logName = `${moduleName}.viewFiles`;

  screen.infoMsg("File Navigation", "Use :n and :p to move to next and previous file");
  let args = [
    "-a TextEdit",
    ...files
  ];
  const child = execFile("open", args, (err, stdout, stderr) => {
    if (err) {
      throw new VError(err, `${logName} `);
    }
    if (stderr.length) {
      console.log(`${logName}: ${stderr}`);
    }
  });
}

module.exports = {
  editFiles,
  viewFiles
};


