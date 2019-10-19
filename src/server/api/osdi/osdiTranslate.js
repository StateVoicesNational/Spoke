import _ from "lodash";
import moment from "moment-timezone";


function contact_to_osdi_person(contact) {

    var all_custom_fields

        if ( contact.custom_fields ) {
            all_custom_fields=JSON.parse(contact.custom_fields);
        } else {
            all_custom_fields={}
        };


    var email=all_custom_fields['email'];
    var custom_fields=_.omit(all_custom_fields,['email']);
    var zip=contact.zip;


    const identifiers=[
        "spoke".concat(
            ":",
            contact.campaign_id,
            "-",
            contact.id
        )
    ]
    var osdi = {
        identifiers: identifiers,
        given_name: contact['first_name'],
        family_name: contact['last_name'],
        phone_numbers: [
            {
                number_type: "Mobile",
                number: contact['cell'],
                sms_capable: !(contact.is_opted_out)
            }
        ],
        modified_date: contact['updated_at'],
        created_date: contact['created_at']

    };

    if (email) {
        osdi.email_addresses=[
            {
                address: email
            }
        ]
    }

    if (zip) {
        osdi.postal_addresses=[
            {
                postal_code: zip
            }
        ]
    }

    if (! _.isEmpty(custom_fields)) {
        osdi.custom_fields=custom_fields
    }



    return osdi;
}

function odata_filter_to_where(filter, resource_type) {
    // I made the lamest OData filter parser.  TBD find a real one from a real developer.

    const dateField= resource_type.concat(".",resource_type === "campaign_contact" ? "updated_at" : "created_at")
    const dateFilter = new RegExp(/modified_date gt \'(.+)\'/)
    let where={}

    const results = filter.match(dateFilter)
    if (results) {
        let dateValue=moment(results[1]).toISOString()
        where=[dateField,'>', dateValue]
        console.log("date where ".concat(where))
    }
    return where;
}

module.exports = {
    contact_to_osdi_person,
    odata_filter_to_where
}