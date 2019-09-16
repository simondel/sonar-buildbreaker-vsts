import * as tl from 'azure-pipelines-task-lib/task';
import Endpoint from './sonarsource/sonarqube/Endpoint';
import TaskReport from './sonarsource/sonarqube/TaskReport';
import Metrics from './sonarsource/sonarqube/Metrics';
import Task, { TimeOutReachedError } from './sonarsource/sonarqube/Task';
import Analysis from './sonarsource/sonarqube/Analysis';
import { getServerVersion } from './sonarsource/helpers/request';

let globalQualityGateStatus = '';

export default async function checkQualityGateTask(endpoint: Endpoint) {
  const metrics = await Metrics.getAllMetrics(endpoint);

  const timeoutSec = 120;
  const serverVersion = await getServerVersion(endpoint);
  const taskReports = await TaskReport.createTaskReportsFromFiles(endpoint, serverVersion);

  const analyses = await Promise.all(
    taskReports.map(taskReport => getReportForTask(taskReport, metrics, endpoint, timeoutSec))
  );

  console.log(`Number of analyses in this build: ${taskReports.length}`);
  console.log(`Summary of statusses: ${analyses.map(a => `"${a.status}"`).join(', ')}`);

  if(analyses.some(a => a.status === 'ERROR')) {
    tl.setResult(tl.TaskResult.Failed, `The analysis did not pass the quality gate because because at least one analysis has has the status 'ERROR'. Attempting to fail the build!`);
  }
};

/**
 * Custom, returns Analysis instead of a string
 * @param taskReport 
 * @param metrics 
 * @param endpoint 
 * @param timeoutSec 
 */
export async function getReportForTask(
  taskReport: TaskReport,
  metrics: Metrics,
  endpoint: Endpoint,
  timeoutSec: number
): Promise<Analysis> {
  try {
    const task = await Task.waitForTaskCompletion(endpoint, taskReport.ceTaskId, timeoutSec);
    const analysis = await Analysis.getAnalysis({
      analysisId: task.analysisId,
      dashboardUrl: taskReport.dashboardUrl,
      endpoint,
      metrics,
      projectName: task.componentName
    });

    if (analysis.status === 'ERROR' || analysis.status === 'WARN' || analysis.status === 'NONE') {
      globalQualityGateStatus = 'failed';
    }

    return analysis;
  } catch (e) {
    if (e instanceof TimeOutReachedError) {
      tl.warning(
        `Task '${
          taskReport.ceTaskId
        }' takes too long to complete. Stopping after ${timeoutSec}s of polling. No quality gate will be displayed on build result.`
      );
    } else {
      throw e;
    }
  }
}