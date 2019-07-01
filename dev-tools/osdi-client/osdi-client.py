#!/usr/bin/env python3

import argparse
import csv
from copy import deepcopy

import requests


def _get_parsed_args():
    arg_parser = argparse.ArgumentParser(description='Upload contacts to Spoke contacts-api')
    arg_parser.add_argument('-f', '--file', help='File containing contacts to upload', required=True)
    arg_parser.add_argument(
        '-b', '--batch_size', help='Number of contacts to send in each batch', type=int, default=100)
    arg_parser.add_argument('-a', '--address', help='API host address')
    arg_parser.add_argument('-p', '--port', help='API port', default=3000)
    arg_parser.add_argument('-c', '--campaign_id', help='ID of campaign to add contacts to')
    arg_parser.add_argument('-o', '--organization_id', help='ID of organization')
    arg_parser.add_argument(
        '--delete_first', action='store_true', help='Delete all existing contacts for the campaign', required=False)
    arg_parser.add_argument(
        '--duplicate_existing',
        action='store_true',
        help='Add contacts that duplicate contacts already in the campaign',
        required=False)
    arg_parser.add_argument('-k', '--api_key', help='API key for authorization')
    arg_parser.add_argument('-u', '--aep', help='AEP URL')

    return arg_parser.parse_args()


def _prepare_batch(batch):
    return batch


def _request(method, url, api_key, **kwargs):
    _kwargs = deepcopy(kwargs)
    headers = _kwargs.get('headers', {})
    headers['authorization'] = 'Basic {api_key}'.format(api_key=api_key)
    headers['OSDI-API-Token']= api_key
    _kwargs.update({'headers': headers})
    return requests.request(method, url, **_kwargs)

def translate_to_osdi_person(contact):

    person={
        "given_name": contact['first_name'],
        "family_name": contact['last_name'],
        "phone_numbers": [
            {
                "number": contact['cell'],
                "number_type": "Mobile"
            }
        ],
        "postal_addresses": [
            {
                "postal_code": contact['zip']
            }
        ],
        "email_addresses": [
              {
               "address": contact['email']
              }
            ]
    }


    return person

def translate_osdi_person_to_signup(person):
    signup={
        "person": person
        }
    return signup

def make_psh(batch):
    psh={
        "signups": batch
    }
    print(psh)
    return psh

def main():
    args = _get_parsed_args()

    if (not (( args.address and args.campaign_id and args.organization_id ) or (args.aep))):
        raise ValueError("Argument error: either --aep or -a/--address, -c/--campaign_id, -o/--organization_id")
        
    api_key = args.api_key

    aep=args.aep

    if ( not aep ):
        aep = 'http://{host}:{port}/osdi/org/{organization_id}/campaigns/{campaign_id}/api/v1'.format(host=args.address, port=args.port, organization_id=args.organization_id, campaign_id=args.campaign_id)

    url = '{aep}/people'.format(
        aep=aep)

    status_url = '{aep}/stats'.format(aep=aep)

    batches = list()

    response = _request('GET', status_url, api_key)
    print('Starting campaign status: {campaign_status}\n'.format(campaign_status=response.text))

    if args.delete_first:
        response = _request('DELETE', url, api_key)
        print('Delete results: {delete_results}\n'.format(delete_results=response.text))

        response = _request('GET', url, api_key)
        print('Campaign status after delete: {campaign_status}\n'.format(campaign_status=response.text))

    with open(args.file, mode='r', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        batch = list()
        for i, row in enumerate(reader, start=1):
            contact = dict(first_name=row.get('firstName'), last_name=row.get('lastName'))
            contact.update({key: row[key] for key in row.keys() if key not in ['firstName', 'lastName']})
            person=translate_to_osdi_person(contact)
            signup=translate_osdi_person_to_signup(person)
            batch.append(signup)

            if i > 0 and not i % args.batch_size:
                batches.append(_prepare_batch(batch))
                batch = list()

        if 1 % args.batch_size:
            batches.append(_prepare_batch(batch))

    for batch in batches:
        post_url = url
        if args.duplicate_existing:
            post_url = post_url + '?duplicate_existing'


        json=make_psh(batch)

        response = _request('POST', post_url, api_key, json=json, headers={'Content-Type':
        'application/json'})
        print(response.text)

    response = _request('GET', status_url, api_key)
    print('\nCampaign status after upload: {campaign_status}\n'.format(campaign_status=response.text))


if __name__ == '__main__':
    try:
        main()
    except Exception as e:  # pylint: disable=broad-except
        print(e)
