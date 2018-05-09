import * as tl from 'vsts-task-lib/task';
import * as path from 'path';
import * as fs from 'fs-extra';

async function run() {
  const sqResultPath = path.join(tl.getVariable('Agent.BuildDirectory'), 'sonarqube-result.json');
  await fs.readFile(sqResultPath, 'UTF-8').then(result => {
    const content = JSON.parse(result);
    if (content.status === 'ERROR') {
      tl.setResult(tl.TaskResult.Failed, `The quality gate has failed with status: ${content.status}`);
    } else {
      console.log(`The quality gate passed with status: ${content.status}`)
    }
  });
}

run();