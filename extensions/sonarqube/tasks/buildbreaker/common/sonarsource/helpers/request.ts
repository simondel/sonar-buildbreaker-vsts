import * as semver from 'semver';
import * as tl from 'azure-pipelines-task-lib/task';
import Endpoint from '../sonarqube/Endpoint';
import * as httpc from 'typed-rest-client/HttpClient';

interface RequestData {
  [x: string]: any;
}

function get(endpoint: Endpoint, path: string, isJson: boolean, query?: RequestData): Promise<any> {
  let queryString: string = "";
  if (query) {
    queryString = "?" + serialize(query);
  }
  
  var promise  = new Promise<any>((resolve, reject) => {
    let httpClient: httpc.HttpClient = new httpc.HttpClient('Sonarqube-buildbreaker-task', [], {
      headers: {
        "Authorization": "Basic " + btoa(`${endpoint.auth.user}:`)
      }
    });
    let url: string = `${endpoint.url}${path}${queryString}`;
    tl.debug(`[SQ] API GET: '${url}'`);
    httpClient.get(url).then((res) => {
      if (res.message.statusCode < 200 || res.message.statusCode >= 300) {
        return logAndReject(
          reject,
          `[SQ] API GET '${url}' failed, status code was: ${res.message.statusCode}`
        );
      }
      res.readBody().then((body) => {
        let response = isJson ? JSON.parse(body) : body;
        resolve(response);
      });
    }).catch((error) => { return logAndReject(
      reject,
      `[SQ] API GET '${path}' failed with error: ${error}}`
    ); });
  });

  return promise;
}

export function getJSON(endpoint: Endpoint, path: string, query?: RequestData): Promise<any> {
  return get(endpoint, path, true, query);
}

export function getServerVersion(endpoint: Endpoint): Promise<semver.SemVer> {
  return get(endpoint, 'api/server/version', false).then(semver.coerce);
}

function serialize(obj) {
  var str = [];
  for (var p in obj)
    if (obj.hasOwnProperty(p)) {
      str.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
    }
  return str.join("&");
}

function logAndReject(reject, errMsg) {
  tl.debug(errMsg);
  return reject(new Error(errMsg));
}