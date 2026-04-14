import axios, { AxiosBasicCredentials } from 'axios';
import * as semver from 'semver';
import * as tl from 'azure-pipelines-task-lib/task';
import Endpoint from '../sonarqube/Endpoint';

interface RequestData {
  [x: string]: any;
}

function get(endpoint: Endpoint, path: string, isJson: boolean, query?: RequestData): Promise<any> {
  tl.debug(`[SQ] API GET: '${path}' with query "${JSON.stringify(query)}"`);
  return new Promise((resolve, reject) => {
    const auth = endpoint.auth;
    let axiosAuth: AxiosBasicCredentials | undefined;

    // Convert endpoint.auth to axios basic auth format
    if (auth.user && auth.pass) {
      axiosAuth = { username: auth.user, password: auth.pass };
    } else if (auth.user) {
      // Token-based auth: use token as username without password
      axiosAuth = { username: auth.user, password: '' };
    }

    axios
      .get(endpoint.url + path, {
        params: query,
        responseType: isJson ? 'json' : 'text',
        auth: axiosAuth,
        validateStatus: () => true // Don't throw on any status code, we'll handle manually
      })
      .then((response) => {
        tl.debug(
          `Response: ${response.status} Body: "${isString(response.data) ? response.data : JSON.stringify(response.data)}"`
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

function isString(x) {
  return Object.prototype.toString.call(x) === '[object String]';
}

export function getJSON(endpoint: Endpoint, path: string, query?: RequestData): Promise<any> {
  return get(endpoint, path, true, query);
}

export function getServerVersion(endpoint: Endpoint): Promise<semver.SemVer> {
  return get(endpoint, '/api/server/version', false).then(semver.coerce);
}

function logAndReject(reject, errMsg) {
  tl.debug(errMsg);
  return reject(new Error(errMsg));
}
