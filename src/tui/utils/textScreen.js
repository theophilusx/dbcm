"use strict";

const chalk = require("chalk");
const boxen = require("boxen");
const cliWidth = require("cli-width");
const wrapAnsi = require("wrap-ansi");

const boxOptions = {
  padding: 1,
  margin: 1,
  float: "center",
  align: "left"
};

function menuHeading(txt) {
  let width = cliWidth({defaultWidth: 80});
  let paddingSize = Math.floor((width - txt.length) / 2);
  let padding = " ".repeat(paddingSize);
  console.log(`${padding}${chalk.underline.yellow(txt)}\n`);
}

function heading(txt) {
  let width = cliWidth({defaultWidth: 80});
  let paddingSize = Math.floor((width - txt.length) / 2);
  let padding = " ".repeat(paddingSize);
  console.log(`${padding}${chalk.underline.cyan(txt)}\n`);
}

function status(state, title="") {
  const width = cliWidth({defaultWidth: 80});
  const repo = `${state.currentRepositoryName()}`;
  const target = `${state.currentTargetName()}`;
  let strLength = "Repository: ".length
      + repo.length
      + title.length
      + "Target: ".length
      + target.length;
  let padding = " ".repeat(Math.floor((width - strLength - 6) / 2));
  console.log(boxen(`  Repository: ${chalk.bold(repo)}${padding}`
                    + `${chalk.green(title)}${padding}Target: ${chalk.bold(target)}  `));
}

function errorMsg(title, msg) {
  let width = cliWidth({defaultWidth: 80}) - 1;
  let txt = wrapAnsi(
    msg.replace(/\n+/g, " ").replace(/\t+/g, ""),
    width - 8,
    {hard: true}
  );
  
  console.log(boxen(chalk`{red ${title.trim()}}\n\n${txt}`, boxOptions));
}

function warningMsg(title, msg) {
  let width = cliWidth({defaultWidth: 80}) - 1;
  let txt = wrapAnsi(
    msg.replace(/\n+/g, " ").replace(/\t+/g, ""),
    width - 8,
    {hard: true}
  );
  
  console.log(boxen(chalk`{yellowBright ${title.trim()}}\n\n${txt}`, boxOptions));
}

function infoMsg(title, msg) {
  let width = cliWidth({defaultWidth: 80}) - 1;
  let txt = wrapAnsi(
    msg.replace(/\n+/g, " ").replace(/\t+/g, ""),
    width - 8,
    {hard: true}
  );

  console.log(boxen(chalk`{cyan ${title.trim()}}\n\n${txt}`, boxOptions));
}

module.exports = {
  menuHeading,
  heading,
  status,
  errorMsg,
  warningMsg,
  infoMsg
};
