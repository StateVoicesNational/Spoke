import _ from "lodash";
import {log} from "../../../lib";

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


export function isEnabled() {
    const envVar = process.env.OSDI_MASTER_ENABLE
    const enabled = truthy(envVar)
    log.info("OSDI State [".concat(enabled,"] var [",envVar,"]"))

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

export default {
    osdiAEP,
    curies,
    isEnabled,
    isDisabled,
    truthy
}