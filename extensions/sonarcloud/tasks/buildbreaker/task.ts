import * as tl from 'vsts-task-lib/task';
import Endpoint, { EndpointType } from './common/Endpoint';
import checkQualityGateTask from './common/checkQualityGateTask';

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