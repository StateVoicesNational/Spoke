


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
            "href": "https://github.com/MoveOnOrg/Spoke"
        }
    ]

}

export default {
    osdiAEP,
    curies
}