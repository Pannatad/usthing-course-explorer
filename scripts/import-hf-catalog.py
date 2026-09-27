"""Reproduce the selected source JSON from the pinned Parquet snapshot.
Use scripts/requirements-data.txt in a Python virtual environment.
"""
import hashlib
import json
import os
from pathlib import Path
from tempfile import NamedTemporaryFile
from urllib.request import urlopen

import pyarrow.parquet as parquet

ROOT = Path(__file__).resolve().parents[1]
CONFIG = json.loads((ROOT / 'data/catalog-config.json').read_text())
FIELDS = ('term_code', 'term_name', 'campus_code', 'department_code', 'prefix',
          'number', 'title', 'min_credits', 'max_credits', 'description',
          'prerequisite', 'corequisite', 'exclusion', 'career_type', 'status', 'timestamp')


def digest(path):
    result = hashlib.sha256()
    with path.open('rb') as source:
        for block in iter(lambda: source.read(1024 * 1024), b''):
            result.update(block)
    return result.hexdigest()


def main():
    directory = ROOT / 'data/source'
    directory.mkdir(parents=True, exist_ok=True)
    source = directory / 'courses.parquet'
    if not source.exists():
        url = f"https://huggingface.co/datasets/ust-archive/catalog/resolve/{CONFIG['revision']}/courses.parquet"
        with NamedTemporaryFile(dir=directory, delete=False) as target:
            temporary = Path(target.name)
            try:
                with urlopen(url, timeout=60) as response:
                    while block := response.read(1024 * 1024):
                        target.write(block)
                target.flush()
                if digest(temporary) != CONFIG['parquetSha256']:
                    raise ValueError('Downloaded snapshot hash mismatch')
                os.replace(temporary, source)
            finally:
                temporary.unlink(missing_ok=True)
    if digest(source) != CONFIG['parquetSha256']:
        raise ValueError('Cached snapshot hash mismatch')
    count = 0
    with NamedTemporaryFile(mode='w', encoding='utf-8', dir=directory, delete=False) as target:
        temporary = Path(target.name)
        try:
            target.write('[')
            for batch in parquet.ParquetFile(source).iter_batches(batch_size=4096, columns=list(FIELDS)):
                for row in batch.to_pylist():
                    if row['term_code'] not in CONFIG['terms'] or row['campus_code'] != CONFIG['campus']:
                        continue
                    row['timestamp'] = row['timestamp'].isoformat()
                    if count:
                        target.write(',')
                    json.dump(row, target, ensure_ascii=False, separators=(',', ':'))
                    count += 1
            target.write(']\n')
            target.flush()
            os.replace(temporary, directory / 'courses.json')
        finally:
            temporary.unlink(missing_ok=True)
    print(f'Imported {count} selected rows')


if __name__ == '__main__':
    main()
