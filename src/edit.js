"use strict";

const moduleName = "edit";

const VError = require("verror");
const { execFile } = require("child_process");
const {ExternalEditor} = require("external-editor");
const fse = require("fse");

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

async function viewFiles(files) {
  const logName = `${moduleName}.viewFiles`;

  try {
    let data = "";
    for (let f of files) {
      data += `\n-- *** start of ${f}\n\n`;
      data += await fse.readFile(f, "utf-8");
      data += `\n-- *** end of ${f}\n`;
    }
    let editor = new ExternalEditor(data);
    editor.run();
    editor.cleanup();
  } catch (err) {
    throw new VError(err, `${logName} `);
  }
}

module.exports = {
  editFiles,
  viewFiles
};


