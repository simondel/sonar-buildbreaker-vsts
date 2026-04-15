import * as tl from "azure-pipelines-task-lib/task";
import Endpoint from "./Endpoint";
import { getJSON } from "../helpers/request";

interface ITask {
  analysisId: string;
  componentKey: string;
  organization?: string;
  status: string;
  errorMessage?: string;
  type: string;
  componentName: string;
}

export default class Task {
  constructor(private readonly task: ITask) {}

  public get analysisId() {
    return this.task.analysisId;
  }

  public get componentName() {
    return this.task.componentName;
  }

  public static waitForTaskCompletion(
    endpoint: Endpoint,
    taskId: string,
    tries: number,
    delayMs = 1000,
  ): Promise<Task> {
    tl.debug(`[SQ] Waiting for task '${taskId}' to complete.`);
    return getJSON(endpoint, `/api/ce/task`, { id: taskId }).then(
      (response: { task?: ITask }) => {
        if (!response || !response.task || !response.task.status) {
          throw new Error(
            `[SQ] Unexpected /api/ce/task response: ${JSON.stringify(response)}`,
          );
        }

        const task = response.task;

        tl.debug(`[SQ] Task status:` + task.status);

        if (tries <= 0) {
          throw new TimeOutReachedError();
        }

        if (task.status === "SUCCESS") {
          return new Task(task);
        }

        if (task.status === "FAILED" || task.status === "CANCELED") {
          throw new Error(`[SQ] Task failed with status ${task.status}`);
        }

        return delay(delayMs).then(() =>
          Task.waitForTaskCompletion(endpoint, taskId, tries - 1, delayMs),
        );
      },
    );
  }
}

export class TimeOutReachedError extends Error {
  constructor() {
    super();
    // Set the prototype explicitly.
    Object.setPrototypeOf(this, TimeOutReachedError.prototype);
  }
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
