import wrap from "../../wrap";
import contactsApi from "./contactsApi";
import osdiResourcesApi from "./osdiResourcesApi";
import osdi from "./osdi"
import express from "express";

function osdiStart(app) {
    app.use('/admin/:orgId/campaigns/:campaignId/contacts', wrap(async (req, res) => {
        await contactsApi(req, res)
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
        await osdiResourcesApi(req, res, {resource_type: 'message', person_id: req.id})
    }))


    app.use('/osdi/org/:orgId/campaigns/:campaignId/api/v1/people/:id/answers', wrap(async (req, res) => {
        await osdiResourcesApi(req, res, {resource_type: 'question_response'})
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


    app.use('/osdi/org/:orgId/campaigns/:campaignId/api/v1\/?$', wrap(async (req, res) => {
        await osdi.AEP(req, res)
    }))


    app.use('/osdi/org/:orgId/campaigns/:campaignId/api/v1/assignments', wrap(async (req, res) => {
        await osdiResourcesApi(req, res, {
            resource_type: 'assignment', child_links: {
                "osdi:messages": 'messages'
            }
        })
    }))

    app.use('/api/v1/org/:orgId/campaigns', wrap(async (req, res) => {
        await osdi.campaignChooser(req, res)
    }))

    app.get('/api/v1/org',
        wrap(async (req, res) => {
            await osdi.orgChooser(req, res)
        }))


    app.get('/api/v1',
        wrap(async (req, res) => {
            await osdi.chooser(req, res)
        }))

    app.use('/hal', express.static('./hal'))

    app.get('/osdi', function(req,res) {
        res.redirect('/hal/browser.html#/api/v1')
    })
}

export default osdiStart
