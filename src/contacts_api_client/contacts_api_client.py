#!/usr/bin/env python3

import csv
import argparse
import ujson
import gzip
import base64


def _get_parsed_args():
    arg_parser = argparse.ArgumentParser(description='Upload contacts to Spoke contacts-api')
    arg_parser.add_argument('-f', '--file', help='File containing contacts to upload', required=True)
    arg_parser.add_argument(
        '-b', '--batch_size', help='Number of contacts to send in each batch', type=int, default=100)

    return arg_parser.parse_args()


def _prepare_batch(batch):
    as_string = ujson.dumps(batch)
    gzipped = gzip.compress(bytearray(as_string, 'utf-8'), 9)
    return base64.encodebytes(gzipped)


def main():
    args = _get_parsed_args()

    batches = list()

    with open(args.file, mode='r', encoding='utf-8') as csvfile:
        reader = csv.DictReader(csvfile)
        batch = list()
        for i, row in enumerate(reader):
            batch.append(dict(
                first_name=row.get('firstName'),
                last_name=row.get('lastName'),
                cell=row.get('cell'),
                external_id=row.get('external_id'),
                custom_fields=row.get('customFields'),
                zip=row.get('zip')))

            if not i % args.batch_size:
                batches.append(_prepare_batch(batch))
                batch = list()

        if 1 % args.batch_size:
            batches.append(_prepare_batch(batch))

    for batch in batches:
        print(batch)


if __name__ == '__main__':
    main()
