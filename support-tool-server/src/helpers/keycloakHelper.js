const Keycloak = require('keycloak-connect')
const session = require('express-session')
const async = require('async')
let memoryStore = new session.MemoryStore();
const { logger } = require('@project-sunbird/logger');

const getKeyCloakClient = (config, store) => {
  const keycloak = new Keycloak({ store: store || memoryStore }, config);
  console.log("in keycloak client");
  keycloak.authenticated = authenticated;
  keycloak.deauthenticated = deauthenticated;
  return keycloak
}
const deauthenticated = function (request) {
  delete request.session['roles']
  delete request.session['rootOrgId']
  delete request.session.userId
  if (request.session) {
    request.session.sessionEvents = request.session.sessionEvents || []
    telemetryHelper.logSessionEnd(request)
    delete request.session.sessionEvents
  }
}
const authenticated = function (request, next) {
    console.log(request);
  try {
    console.log("in try");
    var userId = request.kauth.grant.access_token.content.sub.split(':');
    request.session.userId = userId[userId.length - 1];
    next(null, 'loggedin');
  } catch (err) {
    console.log('userId conversation error', request.kauth.grant.access_token.content.sub, err);
    next(err, null);
  }
}

module.exports = {
  getKeyCloakClient,
  memoryStore
}