import * as tl from 'azure-pipelines-task-lib/task';
import checkQualityGateTask from './common/checkQualityGateTask';
import Endpoint, { EndpointType } from './common/sonarsource/sonarqube/Endpoint';

async function run() {
  try {
    const endpoint = Endpoint.getEndpoint(
      tl.getInput(EndpointType.SonarCloud, true),
      EndpointType.SonarCloud
    );
    await checkQualityGateTask(endpoint);
  } catch (err) {
    tl.setResult(tl.TaskResult.Failed, err.message);
  }
}

run();