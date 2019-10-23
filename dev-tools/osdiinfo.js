import _ from 'lodash'

var dotEnv
var osdiPush, osdiUtil


dotEnv = require('dotenv').config({path: '.env'})

osdiPush = require('../src/server/api/osdi/osdiPush')
osdiUtil = require('../src/server/api/osdi/osdiUtil')


process.env.OSDI_OUTBOUND_DISABLE_CACHE = false
process.env.OSDI_LOGGING_ENABLED = false


console.log("hello")


function constrainChoices(choices, crit) {
    return _.filter(choices, function (c) {
        return (c.type == crit)
    })
}

function displayChoices(choices) {
    console.log(_.padEnd("Description", 55).concat(" Token"))
    console.log(_.repeat("-", 100))
    choices.map(function (c) {
        let line = [
            osdiUtil.st(c.instructions, 55),
            " ",
            c.name
        ].join('')
        console.log(line)
    })
    console.log()
}

async function getAEP() {
    const ketting = await osdiPush.client()
    const aepResource = ketting.getResource()
    const links = await aepResource.links()
    const linkRels = links.map((l) => {
        return l.rel
    })
    osdiUtil.logCLI([
        "questions",
        linkRels.includes('osdi:tags')
    ].join(' '))

    const aep = await aepResource.representation()
    return aep
}

function hc(cmd, help) {
    return [
        osdiUtil.st(cmd,15),
        osdiUtil.st(help,80)
    ].join(' ')
}

function displayHelp() {
    const help = [
        "Usage: osdi-info [command]",
        "",

        hc("actions", "Show available actions from your OSDI server"),
        hc("questions|tags", "show only actions of this type"),
        hc("aep", "show detailed AEP information"),
        hc("script", "Show interaction steps with OSDI handlers"),
        hc("wipe", "Clear OSDI actions from scripts and identifiers from contacts"),
        "",
        "With no command, the validates your OSDI OUTBOUND configuration by downloading AEP info and actions (questions/activist_codes/tags) is displayed",
    ].join("\n")

    console.log(help)
}

function displaySteps(steps) {
    const view = [
        [
            _.padEnd("Cpn", 4),
            _.padEnd("Question",30),
            _.padEnd("Response", 15),
            _.padEnd("OSDI Action", 30)

        ].join(''),
        _.repeat('-',120),
        steps.map((s) => {
            return [
                _.padEnd(s.campaign_id, 4),
                _.padEnd(s.pq.substr(0,30),30),
                _.padEnd(s.answer_option, 15),
                _.padEnd(s.answer_actions, 30)
            ].join('')
        })
    ].flatten().join("\n")

    console.log(view)

}

async function doit() {

    const command = process.argv[3]

    if (!osdiPush.enabled()) {
        console.log("OSDI PUSH is not enabled!")
        return
    }

    let choices
    let aep


    aep = await getAEP()

    let myChoices = choices

    console.log([
        "OSDI PUSH Server Info: ",
        aep.body.product_name,
        " ",
        osdiPush.osdiOutboundAEP(),
        " says ",
        aep.body.motd
    ].join(''))
    console.log()

    switch (command) {
        case "actions":
            choices = await osdiPush.getActions()
            displayChoices(choices)
            break;

        case "tags":
            choices = await osdiPush.getActions()
            myChoices = constrainChoices(choices, 'tag_activist_code')
            displayChoices(myChoices)
            break;

        case "questions":
            choices = await osdiPush.getActions()
            myChoices = constrainChoices(choices, 'tag_activist_code')
            displayChoices(myChoices)
            break;

        case "aep":
            osdiUtil.logCLI(aep)
            break;

        case "script":
            const steps = await osdiPush.configuredInteractionSteps()
            displaySteps(steps)
            break;

        case "wipe":
            const count = await osdiPush.clearOsdiIdentifiers()
            osdiUtil.logCLI("Cleared osdi_identifiers from ".concat(count, " contacts"))
            const clearedSteps = await osdiPush.clearConfiguredInteractionSteps('osdi:')
            osdiUtil.logCLI("Cleared ".concat(clearedSteps," OSDI interaction steps"))
            break;


        case "help":
        default:

            displayHelp()
            break;

    }
}


Promise.resolve(doit().catch(async err => {
        switch (err.message) {
            case "HTTP error 403":
                console.log("403 Access Denied.  Invalid API token??")
                console.log(await err.response.text())
                break;

            default:
                console.log(err.message)
                console.log(err);
        }

    }).then(() => {

        process._getActiveHandles();
        process._getActiveRequests();
        process.exit();
    }
    )
);


