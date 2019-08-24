import _ from 'lodash'
import {cacheableData, r, createLoaders} from '../../models';
import { getHash } from './guid'

async function sendForbiddenResponse(req,res) {
  res.writeHead(403)
  var error={
    "osdi:error": {
      response_code: 403,
      error_description: "You need to use an OSDI-API-Token HTTP header containing your token, or you need to be" +
          " logged in with sufficient privileges.",
      auth_status: await authStatusObject(req,res)
    }
  }
  res.end(JSON.stringify(error,null, 2))
}


async function sendDisabledResponse(req,res) {
  res.writeHead(510)
  var error={
    "osdi:error": {
      response_code: 510,
      error_description: "OSDI is not enabled for this resource"
    }
  }
  res.end(JSON.stringify(error,null, 2))
}


export async function validOSDIToken(req, res) {
/*
  Quickly check for authorization.  Used at the top of API functions to abort quickly
 */
  const osdi_api_token = req.headers['osdi-api-token'];

  const orgId=req.params.orgId

  if (! (osdi_api_token && orgId )) {
    return false
  }

  const organization = await r.knex('organization').where('id', orgId).first('features')
  const features = organization.features ? JSON.parse(organization.features) : {}
  const osdiApiToken = features.osdi_api_token

  return getHash(osdi_api_token)===osdiApiToken
}

export function osdiEnabledForOrg(organization) {
  if (organization.features && JSON.parse(organization.features).osdi_enabled) {
    return true
  } else {
    return false
  }
}

export async function osdiEnabledForOrgId(orgId) {

  const organization = await r.knex('organization').where('id', orgId).first()

  return osdiEnabledForOrg(organization)
}

export async function osdiEnabled(req,res) {
  const orgId=req.params.orgId
  if (orgId) {
    return await osdiEnabledForOrgId(orgId)
  } else {
    return false
  }
}

export async function validAPIUser(req,res) {
  if (req.user && req.params.orgId) {
    if ( req.user.is_superadmin) {
      return true
    }
    // require a permission at-or-higher than the permission requested
    const hasRole = await cacheableData.user.userHasRole(req.user, req.params.orgId, 'ADMIN')

    if (hasRole) {
      return true
    } else {
      return false
    }
  } else {
      return false
  }
}

export async function authShortCircuit(req, res, orgId) {
  /*
    Quickly check for authorization.  Used at the top of API functions to abort quickly
   */

  if (! await osdiEnabled(req,res)) {
    await sendDisabledResponse(req,res)
    return true
  }

  var conditions=[
    await validOSDIToken(req,res),
    await validAPIUser(req,res)
  ]
  if (_.some(conditions, Boolean)) {
    return false;
  } else {
    await sendForbiddenResponse(req,res)
    return true
  }
}

export async function authStatusObject(req,res) {
  const token_status=await validOSDIToken(req,res)
  const user_status=await validAPIUser(req,res)

  const osdi_enabled = await osdiEnabled(req,res)

  const result= {
    token_status: token_status ? "VALID_OSDI_TOKEN" : "INVALID_OSDI_TOKEN",
    user_status: user_status ? "USER_LOGGED_IN" : "LOGGED_OUT",
    authenticated: token_status || user_status,
    osdi_enabled: osdi_enabled
  }

  return result
}

export async function authStatus(req,res) {
  const result=await authStatusObject(req,res);
  return "".concat(result.token_status, " ", result.user_status)
}

function campaignStatusShortCircuit(campaign, res) {
  let message = ''
  if (campaign.is_archived) {
    message = 'Campaign is archived'
  } else if (campaign.is_started) {
    message = 'Campaign is started'
  }

  if (message) {
    res.writeHead(403)
    res.end(message)
    return true
  }

  return false
}

export default {
  authShortCircuit,
  campaignStatusShortCircuit,
  authStatus,
  authStatusObject,
  osdiEnabled,
  osdiEnabledForOrgId,
  osdiEnabledForOrg
}