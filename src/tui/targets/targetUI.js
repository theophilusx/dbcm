"use strict";

const moduleName = "targetUI";

const VError = require("verror");
const inquirer = require("inquirer");
const Target = require("../../Target");
const menu = require("../utils/textMenus");
const screen = require("../utils/textScreen");

function initWarning(state) {
  screen.warningMsg("Warning!", `
Target database ${state.currentTargetName()} needs to be initialised for DBCM
Please either run the shell script in bin/dbcm-init.sh
or execute the SQL script in

sql/dbcm-init.sql

in the target database.

Note that if you use the SQL script, you also need to add
the dbcm_user role to the user you will be applying
database changes with
`);
}

function setupQuestions(state) {
  const logName = `${moduleName}.setupQuestions`;

  try {
    let choices = state.currentRepositoryDef().targetNames();
    choices.push(new inquirer.Separator());
    choices.push({
      name: "Add New DB Target",
      value: "newTarget"
    });
    choices.push({
      name: "Exit Menu",
      value: "exitMenu"
    });

    const questions = [
      {
        type: "list",
        name: "choice",
        message: "Select DB target:",
        choices: choices
      },
      {
        type: "input",
        name: "targetName",
        message: "Target name:",
        when: answers => {
          return answers.choice === "newTarget";
        }
      },
      {
        type: "input",
        name: "database",
        message: "Target database name:",
        when: answers => {
          return answers.choice === "newTarget";
        }
      },
      {
        type: "input",
        name: "host",
        message: "Target database host:",
        when: answers => {
          return answers.choice === "newTarget";
        }
      },
      {
        type: "input",
        name: "port",
        message: "Target database port:",
        default: 5432,
        when: answers => {
          return answers.choice === "newTarget";
        }
      },
      {
        type: "input",
        name: "user",
        message: "Target database user:",
        when: answers => {
          return answers.choice === "newTarget";
        }
      },
      {
        type: "input",
        name: "password",
        message: "Target database password:",
        when: answers => {
          return answers.choice === "newTarget";
        }
      }];
    return questions;
  } catch (err) {
    throw new VError(err, `${logName} Failed to setup target questions`);
  }
}

function targetActions(state) {
  const logName = `${moduleName}.targetActions`;

  return async answers => {
    try {
      state.setMenuChoice(answers.choice);
      if (menu.doExit(answers.choice)) {
        return state;
      } else if (answers.choice === "newTarget") {
        let target = new Target(
          answers.targetName,
          answers.database,
          answers.user,
          answers.password,
          answers.host,
          answers.port
        );
        state.addCurrentRepositoryTarget(target);
        state.setCurrentTargetName(answers.targetName);
        await state.writeUserInit();
      } else {
        state.setCurrentTargetName(answers.choice);
      }
      let target = state.currentTargetDef();
      let initState = await target.isInitialised();
      if (!initState) {
        initWarning(state);
      }
      return state;
    } catch (err) {
      throw new VError(err, `${logName}`);
    }
  };
}

function selectTarget(state) {
  const logName = `${moduleName}.selectTarget`;
  const questions = setupQuestions(state);
  
  return menu.genericMenu(state, "Target Menu", questions, targetActions)
    .catch(err => {
      throw new VError(err, `${logName}`);
    });
}


// function rollbackActions(state) {
//   const logName = `${moduleName}.rollbackActions`;
  
//   return async answer => {
//     try {
//       state.setMenuChoice(answer.choice);
//       if (menu.doExit(answer.choice)) {
//         return state;
//       }
//       let [sequence, pId] = answer.choice.split(":");
//       if (sequence > 0) {
//         screen.warningMsg(
//           "Multiple Rollbacks",
//           "The plan you have selected was not the most recent plan applied to this target\n"
//             + "If you decide to continue, all change plans applied following the plan you selected\n"
//             + "will be rolled back. \n"
//             + `A total of ${sequence + 1} plans will be rolled back`
//         );
//         let doIt = menu.confirmMenu(
//           "Apply Multiple Rollbacks",
//           `Rollback ${sequence + 1} plans:`
//         );
//         if (doIt) {
//           let planList = await queries.getRollbackSets(
//             state.currentTargetDef(),
//             pId
//           );
//           let planDefs = planList.map(id => plans.findPlan(state, id));
//           console.log("Will rollback these plans");
//           console.dir(planDefs);
//         }
//       } else {
//         let planInfo = plans.findPlan(state, pId);
//         if (planInfo.length) {
//           await psql.rollbackPlan(state, planInfo[1]);
//         } else {
//           screen.errorMsg(
//             "No Plan Definition",
//             `Could not find a plan definition for ${pId}`
//           );
//         }
//       }
//       return state;
//     } catch (err) {
//       throw new VError(err, `${logName} Failed to process plan rollback`);
//     }
//   };
// }

// async function performPlanRollback(state) {
//   const logName = `${moduleName}.performPlanRollback`;
  
//   try {
//     let candidateList = await queries.getRollbackCandidates(state.currentTargetDef());
//     if (candidateList.length) {
//       let choices = menu.buildChoices(candidateList);
//       state = await menu.listMenu(
//         state,
//         "Rollback Changes",
//         "Select plan for rollback:",
//         choices,
//         rollbackActions(state)
//       );
//     }
//     return state;
//   } catch (err) {
//     throw new VError(err, `${logName} Error applying rollback`);
//   }
// }

module.exports = {
  selectTarget,
  //performPlanRollback
};

