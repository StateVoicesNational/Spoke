#!/usr/bin/env python3

import csv
import argparse
import ujson
import gzip
import base64
import requests


def _get_parsed_args():
    arg_parser = argparse.ArgumentParser(description='Upload contacts to Spoke contacts-api')
    arg_parser.add_argument('-f', '--file', help='File containing contacts to upload', required=True)
    arg_parser.add_argument(
        '-b', '--batch_size', help='Number of contacts to send in each batch', type=int, default=100)
    arg_parser.add_argument('-a', '--address', help='API host address', required=True)
    arg_parser.add_argument('-p', '--port', help='API port', default=3000)
    arg_parser.add_argument('-c', '--campaign_id', help='ID of campaign to add contacts to', required=True)
    arg_parser.add_argument('-o', '--organization_id', help='ID of organization', required=True)
    arg_parser.add_argument(
        '--delete_first', action='store_true', help='Delete all existing contacts for the campaign', required=False)
    arg_parser.add_argument(
        '--duplicate_existing',
        action='store_true',
        help='Add contacts that duplicate contacts already in the campaign',
        required=False)

    return arg_parser.parse_args()


def _prepare_batch(batch):
    return batch


def main():
    args = _get_parsed_args()

    url = 'http://{host}:{port}/admin/{organization_id}/campaigns/{campaign_id}/contacts'.format(
        host=args.address, port=args.port, organization_id=args.organization_id, campaign_id=args.campaign_id)

    batches = list()

    response = requests.get(url)
    print('Starting campaign status: {campaign_status}\n'.format(campaign_status=response.text))

    if args.delete_first:
        response = requests.delete(url)
        print('Delete results: {delete_results}\n'.format(delete_results=response.text))

        response = requests.get(url)
        print('Campaign status after delete: {campaign_status}\n'.format(campaign_status=response.text))

    with open(args.file, mode='r', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        batch = list()
        for i, row in enumerate(reader, start=1):
            contact = dict(first_name=row.get('firstName'), last_name=row.get('lastName'))
            contact.update({key: row[key] for key in row.keys() if key not in ['firstName', 'lastName']})
            batch.append(contact)

            if i > 0 and not i % args.batch_size:
                batches.append(_prepare_batch(batch))
                batch = list()

        if 1 % args.batch_size:
            batches.append(_prepare_batch(batch))

    for batch in batches:
        post_url = url
        if args.duplicate_existing:
            post_url = post_url+'?duplicate_existing'

        response = requests.post(post_url, json=batch, headers={'Content-Type': 'application/json'})
        print(response.text)

    response = requests.get(url)
    print('\nCampaign status after upload: {campaign_status}\n'.format(campaign_status=response.text))


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(e)
