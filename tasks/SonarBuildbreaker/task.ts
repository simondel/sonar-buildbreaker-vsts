import * as tl from 'vsts-task-lib/task';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as request from 'request';

async function run() {
  getTaskReport().then(report => {
    request(`${report.serverUrl}/api/ce/task?id=${report.ceTaskId}`, (error, response, body) => {
      request(`${report.serverUrl}/api/qualitygates/project_status?analysisId=${JSON.parse(body).task.analysisId}`, (error, response, body) => {
        const projectStatus = JSON.parse(body).projectStatus;
        if (projectStatus.status === 'ERROR') {
          tl.setResult(tl.TaskResult.Failed, `The quality gate has failed with status: ${projectStatus.status}`);
        } else {
          console.log(`The quality gate passed with status: ${projectStatus.status}`)
        }
      });
    });
  });
}

async function getTaskReport(): Promise<TaskResult> {
  return new Promise<TaskResult>(resolve => {
    const taskReportGlob = path.join('**', 'report-task.txt');
    const taskReportGlobResult = tl.findMatch(
      tl.getVariable('Agent.BuildDirectory'),
      taskReportGlob
    );
    fs.readFile(taskReportGlobResult[0], 'UTF-8').then(fileContent => {
      const lines: string[] = fileContent.replace(/\r\n/g, '\n').split('\n'); // proofs against xplat line-ending issues
      const settings = new Map<string, string>();
      lines.forEach((line: string) => {
        const splitLine = line.split('=');
        if (splitLine.length > 1) {
          settings.set(splitLine[0], splitLine.slice(1, splitLine.length).join());
        }
      });

      resolve({
        ceTaskId: settings.get('ceTaskId'),
        ceTaskUrl: settings.get('ceTaskUrl'),
        dashboardUrl: settings.get('dashboardUrl'),
        projectKey: settings.get('projectKey'),
        serverUrl: settings.get('serverUrl')
      });
    });
  });
}

interface TaskResult {
  ceTaskId: string,
  ceTaskUrl: string,
  dashboardUrl: string,
  projectKey: string,
  serverUrl: string,
};

run();