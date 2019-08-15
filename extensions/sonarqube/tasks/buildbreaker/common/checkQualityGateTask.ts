import * as tl from 'vsts-task-lib/task';
import * as path from 'path';
import * as fs from 'fs-extra';
import * as request from 'request';
import TaskResult from './TaskResult';
import Endpoint from './Endpoint';

export default async function checkQualityGateTask(endpoint: Endpoint) {
  return new Promise<void>(resolve => {
    getTaskReport().then(report => {
      console.log(`Retrieving analysisId from ${report.serverUrl}/api/ce/task?id=${report.ceTaskId}`);
      request.get(
        {
          method: 'GET',
          baseUrl: report.serverUrl,
          uri: `/api/ce/task?id=${report.ceTaskId}`,
          json: true,
          auth: endpoint.auth,

        }, (error, response, body) => {
          handleErrors(error, response);
          if (!body.task || !body.task.analysisId) {
            tl.setResult(tl.TaskResult.Failed, `Unknown result from previous http request. The body is: ${body}. Statuscode is ${response.statusCode}`);
          }
          console.log(`Retrieving quality gate report from ${report.serverUrl}/api/qualitygates/project_status?analysisId=${body.task.analysisId}`);
          request.get(
            {
              method: 'GET',
              baseUrl: report.serverUrl,
              uri: `/api/qualitygates/project_status?analysisId=${body.task.analysisId}`,
              json: true,
              auth: endpoint.auth
            }, (error, response, body) => {
              handleErrors(error, response);
              if (!body.projectStatus || !body.projectStatus.status) {
                tl.setResult(tl.TaskResult.Failed, `Unknown result from previous http request. The body is: ${body}. Statuscode is ${response.statusCode}`);
              }
              const projectStatus = body.projectStatus;
              console.log(`The quality gate retrieved. The status of the quality gate is ${projectStatus.status}`);
              if (projectStatus.status === 'ERROR') {
                tl.setResult(tl.TaskResult.Failed, `The analysis did not pass the quality gate because it has the status: ${projectStatus.status}. Attempting to fail the build!`);
              } else {
                console.log(`The analysis has passed the quality gate: ${projectStatus.status}`);
              }
              resolve();
            });
        });
    });
  });
};

async function getTaskReport(): Promise<TaskResult> {
  const REPORT_TASK_NAME = 'report-task.txt';
  const SONAR_TEMP_DIRECTORY_NAME = 'sonar';

  return new Promise<TaskResult>(resolve => {
    const taskReportGlob = path.join(
      SONAR_TEMP_DIRECTORY_NAME,
      tl.getVariable('Build.BuildNumber'),
      '**',
      REPORT_TASK_NAME
    );
    const taskReportGlobResult = tl.findMatch(
      tl.getVariable('Agent.TempDirectory'),
      taskReportGlob
    );
    console.log(`Getting task report from file ${taskReportGlobResult[0]}`);
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
};

function handleErrors(error: any, response: request.Response) {
  if (!response) {
    tl.setResult(tl.TaskResult.Failed, `Unable to get a result! It has value ${response} and a possible error is ${error}`);
  }

  if (response.statusCode < 200 || response.statusCode >= 300) {
    tl.setResult(tl.TaskResult.Failed, `Something went wrong! Got statuscode ${response.statusCode} and error ${error}`);
  }
}