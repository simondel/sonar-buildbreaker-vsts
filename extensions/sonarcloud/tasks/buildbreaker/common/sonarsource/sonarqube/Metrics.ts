import * as tl from "azure-pipelines-task-lib/task";
import Endpoint from "./Endpoint";
import { getJSON } from "../helpers/request";

interface IMetric {
  custom?: boolean;
  decimalScale?: number;
  description?: string;
  direction?: number;
  domain?: string;
  hidden?: boolean;
  key: string;
  name: string;
  qualitative?: boolean;
  type: string;
}

interface MetricsResponse {
  metrics: IMetric[];
  p: number;
  ps: number;
  total: number;
}

export default class Metrics {
  constructor(public metrics: IMetric[]) {}

  public getMetricByKey(key: string) {
    return this.metrics.find((metric) => metric.key === key);
  }

  public static getAllMetrics(endpoint: Endpoint): Promise<Metrics> {
    return inner().catch((err) => {
      tl.error(`[SQ] Could not fetch metrics`);

      if (err && err.message) {
        tl.error(err.message);
      } else if (err) {
        tl.error(JSON.stringify(err));
      }

      throw err;
    });

    function inner(
      data: { f?: string; p?: number; ps?: number } = { f: "name", ps: 500 },
      prev?: MetricsResponse,
    ): Promise<Metrics> {
      return getJSON(endpoint, "/api/metrics/search", data).then(
        (r: MetricsResponse) => {
          if (
            !r ||
            !Array.isArray(r.metrics) ||
            typeof r.p !== "number" ||
            typeof r.ps !== "number" ||
            typeof r.total !== "number"
          ) {
            throw new Error(
              `[SQ] Unexpected /api/metrics/search response: ${JSON.stringify(r)}`,
            );
          }

          const result = prev ? prev.metrics.concat(r.metrics) : r.metrics;

          if (r.p * r.ps >= r.total) {
            return new Metrics(result);
          }

          return inner({ ...data, p: r.p + 1 }, { ...r, metrics: result });
        },
      );
    }
  }
}
