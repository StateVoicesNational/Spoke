import wrap from "../../wrap";
import contactsApi from "./contactsApi";
import osdiResourcesApi from "./osdiResourcesApi";
import osdi from "./osdi"
import osdiMeta from "./osdiMeta"
import osdiUtil from "./osdiUtil"
import {log} from "../../../lib";
import cors from 'cors'

function osdiCors(app) {

    var corsOptions={
        origin: true,
        credentials: true,
        allowedHeaders: [
            'Cookie',
            'OSDI-API-Token'
        ]
    }
    app.options('*', cors(corsOptions)) // include before other routes
    app.use('/osdi',cors(corsOptions))
    app.use('/api/v1',cors(corsOptions))
}
function initializeService(app) {


    app.use('/osdi/org/:orgId/campaigns/:campaignId/api/v1/users/:id/assignments', wrap(async (req, res) => {
        await osdiResourcesApi(req, res, {resource_type: 'assignment', where: {user_id: req.params.id}})
    }))

    app.use('/osdi/org/:orgId/campaigns/:campaignId/api/v1/users/:id/messages', wrap(async (req, res) => {
        await osdiResourcesApi(req, res, {resource_type: 'message', slicer: 'user_messages'})
    }))

    app.use('/osdi/org/:orgId/campaigns/:campaignId/api/v1/users/:id', wrap(async (req, res) => {
        await osdiResourcesApi(req, res, {
            resource_type: 'user', single: true, child_links: {
                'osdi:messages': 'messages'
            }
        })
    }))

    app.use('/osdi/org/:orgId/campaigns/:campaignId/api/v1/users', wrap(async (req, res) => {
        await osdiResourcesApi(req, res, {
            resource_type: 'user', child_links: {
                "osdi:messages": 'messages'
            }, where: {}
        })
    }))


    app.use('/osdi/org/:orgId/campaigns/:campaignId/api/v1/people/:id/messages', wrap(async (req, res) => {
        await osdiResourcesApi(req, res, {resource_type: 'message', people_messages: true})
    }))


    app.use('/osdi/org/:orgId/campaigns/:campaignId/api/v1/people/:id/answers', wrap(async (req, res) => {
        await osdiResourcesApi(req, res, {resource_type: 'question_response', where: {'campaign_contact_id': req.params.id}})
    }))

    app.use('/osdi/org/:orgId/campaigns/:campaignId/api/v1/people/:id', wrap(async (req, res) => {
        await osdiResourcesApi(req, res, {resource_type: 'campaign_contact', single: true})
    }))


    app.use('/osdi/org/:orgId/campaigns/:campaignId/api/v1/people', wrap(async (req, res) => {
        await contactsApi(req, res)
    }))

    app.use('/osdi/org/:orgId/campaigns/:campaignId/api/v1/answers', wrap(async (req, res) => {
        await osdiResourcesApi(req, res, {resource_type: 'question_response', root_answers: true}
        )
    }))

    app.use('/osdi/org/:orgId/campaigns/:campaignId/api/v1/stats', wrap(async (req, res) => {
        await osdi.campaignStats(req, res)
    }))

    app.use('/osdi/org/:orgId/campaigns/:campaignId/api/v1/messages', wrap(async (req, res) => {
        await osdiResourcesApi(req, res, {resource_type: 'message', root_messages: true})
    }))


    app.use('/osdi/org/:orgId/campaigns/:campaignId/api/v1/questions/:id/answers', wrap(async (req, res) => {
        await osdiResourcesApi(req, res, {
            resource_type: 'question_response',
            where: {interaction_step_id: req.params.id}
        })
    }))

    app.use('/osdi/org/:orgId/campaigns/:campaignId/api/v1/questions/:id', wrap(async (req, res) => {
        await osdiResourcesApi(req, res, {resource_type: 'interaction_step', single: true})
    }))

    app.use('/osdi/org/:orgId/campaigns/:campaignId/api/v1/questions', wrap(async (req, res) => {
        await osdiResourcesApi(req, res, {resource_type: 'interaction_step'})
    }))

    app.use('/osdi/org/:orgId/campaigns/:campaignId/api/v1/assignments/:id/messages', wrap(async (req, res) => {
        await osdiResourcesApi(req, res, {resource_type: 'message', where: {assignment_id: req.params.id}})
    }))


    app.use('/osdi/org/:orgId/campaigns/:campaignId/api/v1/assignments/:id', wrap(async (req, res) => {
        await osdiResourcesApi(req, res, {
            resource_type: 'assignment',
            single: true,
            where: {assignment_id: req.params.id}
        })
    }))


    app.use('/osdi/org/:orgId/campaigns/:campaignId/api/v1/assignments', wrap(async (req, res) => {
        await osdiResourcesApi(req, res, {
            resource_type: 'assignment', child_links: {
                "osdi:messages": 'messages'
            }
        })
    }))



    app.use('/osdi/org/:orgId/campaigns/:campaignId/api/v1/assignments', wrap(async (req, res) => {
        await osdiResourcesApi(req, res, {
            resource_type: 'assignment', child_links: {
                "osdi:messages": 'messages'
            }
        })
    }))


    app.use('/osdi/org/:orgId/campaigns/:campaignId/api/v1\/?$', wrap(async (req, res) => {
        await osdiMeta.AEP(req, res)
    }))

    app.use('/osdi/org/:orgId/campaigns', wrap(async (req, res) => {
        await osdiMeta.campaignChooser(req, res)
    }))


    app.get('/osdi/org/:orgId',
        wrap(async (req, res) => {
            await osdiMeta.orgAEP(req, res)
        }))


    app.get('/api/v1',
        wrap(async (req, res) => {
            await osdiMeta.chooser(req, res)
        }))

    app.get('/osdi', function(req,res) {
        console.log("in /osdi redirect")
        res.redirect('/osdi-browser/browser.html#/api/v1')
    })
}

function disableService(app){
    app.use('/osdi',
        wrap(async (req, res) => {
            await osdiMeta.disabled(req, res)
        }))


}

export function startIfEnabled(app) {
    osdiCors(app)
    if ( osdiUtil.isEnabled()) {
        log.info("OSDI Service is starting")
        initializeService(app)
    } else {
        log.info("OSDI Service DISABLED.  To enable set OSDI_MASTER_ENABLE environment variable.")
        disableService(app)
    }
}

export default {
    initializeService: initializeService,
    isEnabled: osdiUtil.isEnabled,
    isDisabled: osdiUtil.isDisabled,
    startIfEnabled: startIfEnabled
}
