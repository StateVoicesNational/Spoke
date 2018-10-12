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

    return arg_parser.parse_args()


def _prepare_batch(batch):
    # ujson.dumps({'contacts': batch})
    # return gzip.compress(bytearray(as_string, 'utf-8'), 9)
    # return base64.encodebytes(gzipped)
    return batch


def main():
    args = _get_parsed_args()

    url = 'http://{host}:{port}/admin/{organization_id}/campaigns/{campaign_id}/contacts'.format(
        host=args.address, port=args.port, organization_id=args.organization_id, campaign_id=args.campaign_id)

    batches = list()

    response = requests.get(url)
    print(response.text)

    # response = requests.delete(url)
    # print(response.text)

    # response = requests.get(url)
    # print(response.text)

    with open(args.file, mode='r', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        batch = list()
        for i, row in enumerate(reader):
            batch.append(
                dict(
                    first_name=row.get('firstName'),
                    last_name=row.get('lastName'),
                    cell=row.get('cell'),
                    external_id=row.get('external_id'),
                    # custom_fields=row.get('customFields'),
                    zip=row.get('zip')))

            if i > 0 and not i % args.batch_size:
                batches.append(_prepare_batch(batch))
                batch = list()

        if 1 % args.batch_size:
            batches.append(_prepare_batch(batch))

    for batch in batches:
        headers = {'Content-Type': 'application/json'}
        response = requests.post(url, json=batch, headers=headers)
        print(response.text)


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(e)
