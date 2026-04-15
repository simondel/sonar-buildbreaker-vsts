import axios, { AxiosBasicCredentials, RawAxiosRequestHeaders } from 'axios';
import * as semver from 'semver';
import * as tl from 'azure-pipelines-task-lib/task';
import Endpoint from '../sonarqube/Endpoint';

interface RequestData {
  [key: string]: any;
}

function isString(obj: any): obj is string {
  return typeof obj === 'string';
}

function logAndReject(reject: Function, message: string): void {
  tl.debug(message);
  reject(new Error(message));
}

function get(endpoint: Endpoint, path: string, isJson: boolean, query?: RequestData): Promise<any> {
  tl.debug(`[SQ] API GET: '${path}' with query "${JSON.stringify(query)}"`);

  return new Promise((resolve, reject) => {
    const auth = endpoint.auth;

    let axiosAuth: AxiosBasicCredentials | undefined;
    let headers: RawAxiosRequestHeaders  | undefined;

    if (auth.user && auth.pass) {
      axiosAuth = { username: auth.user, password: auth.pass };
    } else if (auth.user) {
      headers = {
        Authorization: `Bearer ${auth.user}`,
      };
    }

    axios
      .get(endpoint.url + path, {
        params: query,
        responseType: isJson ? 'json' : 'text',
        auth: axiosAuth,
        headers,
        validateStatus: () => true,
      })
      .then((response) => {
        tl.debug(
          `Response: ${response.status} Body: "${
            isString(response.data) ? response.data : JSON.stringify(response.data)
          }"`
        );

        if (response.status < 200 || response.status >= 300) {
          return logAndReject(
            reject,
            `[SQ] API GET '${path}' failed, status code was: ${response.status}`
          );
        }

        return resolve(response.data || (isJson ? {} : ''));
      })
      .catch((error) => {
        return logAndReject(
          reject,
          `[SQ] API GET '${path}' failed, error was: ${JSON.stringify(error.message)}`
        );
      });
  });
}

export function getJSON(endpoint: Endpoint, path: string, query?: RequestData): Promise<any> {
  return get(endpoint, path, true, query);
}

export function getServerVersion(endpoint: Endpoint): Promise<semver.SemVer> {
  return getText(endpoint, '/api/server/version').then(semver.coerce);
}

export function getText(endpoint: Endpoint, path: string, query?: RequestData): Promise<any> {
  return get(endpoint, path, false, query);
}