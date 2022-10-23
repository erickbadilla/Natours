/* eslint-disable */

//Changes this configurtion depending on the enviroment running the Node App.
export const serverUrl = 'http://127.0.0.1';
export const serverPort = '8080';
export const severAPIV1Path = 'api/v1';
export const serverAPIRouteV1 =
  window.location.protocol === 'https:'
    ? severAPIV1Path
    : `${serverUrl}:${serverPort}/${severAPIV1Path}`;
