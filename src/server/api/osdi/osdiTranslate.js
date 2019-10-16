import _ from "lodash";


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

module.exports = {
    contact_to_osdi_person
}