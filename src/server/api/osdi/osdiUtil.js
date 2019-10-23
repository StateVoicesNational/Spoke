import _ from "lodash";
import {log} from "../../../lib";

export function serverContentType() {
    return process.env.OSDI_SERVER_CONTENT_TYPE || 'application/json'
}
function osdiAEP(req) {
    return "".concat(process.env.BASE_URL,
        "/osdi/org/",
        req.params.orgId,
        "/campaigns/",
        req.params.campaignId,
        "/api/v1")
}


function curies() {
    return [
        {
            "name": "osdi",
            "href": "http://opensupporter.github.io/osdi-docs/{rel}",
            "templated": true
        },
        {
            "name": "spoke",
            "href": "/assets/osdi/OSDI_CONFIGURATION.md"
        }
    ]

}


export function st(str,length) {
    return _.padEnd(str.substr(0,length),length)
}

export function isEnabled() {
    const envVar = process.env.OSDI_SERVER_ENABLE
    const enabled = truthy(envVar)

    return enabled
}

export function truthy(value){
    return _.some([true,'true','1',1], (item) => (
        _.isEqual(value, item))
    )
}
export function isDisabled() {
    return (! isEnabled())
}


export function prettyOSDI(osdi) {
    return JSON.stringify(osdi,undefined,2)
}


function loggingEnabled() {
    return truthy(process.env.OSDI_LOGGING_ENABLED)
}

function logOSDI(osdi) {

    if ( loggingEnabled() ) {
        const message = ( typeof(osdi) != "string") ? prettyOSDI(osdi) : osdi

        log.info(message)
    }
}

export function logCLI(osdi) {
    const message = ( typeof(osdi) != "string") ? prettyOSDI(osdi) : osdi

    console.log(message)
    return
}



export default {
    osdiAEP,
    curies,
    isEnabled,
    isDisabled,
    truthy,
    prettyOSDI,
    logOSDI,
    logCLI,
    serverContentType,
    st
}