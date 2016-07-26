# Copyright (C) 2015 Fanout, Inc.
#
# Permission is hereby granted, free of charge, to any person obtaining a
# copy of this software and associated documentation files (the
# "Software"), to deal in the Software without restriction, including
# without limitation the rights to use, copy, modify, merge, publish,
# distribute, sublicense, and/or sell copies of the Software, and to
# permit persons to whom the Software is furnished to do so, subject to
# the following conditions:
#
# The above copyright notice and this permission notice shall be included
# in all copies or substantial portions of the Software.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
# OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
# MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
# IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
# CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
# TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
# SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

# SSH tunnel script
#
# Set the following environment variables:
#
#   SSH_TUNNEL_TARGET=user@hostname:port
#   SSH_TUNNEL_KEY=RSA:{base64 private key}
#   SSH_TUNNEL_FORWARDS=localaddr:localport:remoteaddr:remoteport,[...]
#
# Notes:
#
#   SSH_TUNNEL_KEY is the key type (e.g. "RSA"), a colon character, and then
#   the ssh private key in base64 without the headers/footers or newlines.
#   Yes, you're setting an entire giant ssh key as an environment variable,
#   but it works. :)
#
#   SSH_TUNNEL_FORWARDS is a comma-separated list of args that would normally
#   each be preceded by -L in an ssh command.
#
# In your Procfile, simply run the tunnel before any workers that need it.
#
#   web: python tunnel.py && ....
#
# It's safe to run the script multiple times concurrently. Only one tunnel will
# be made and the other invocations will fail successfully. This way multiple
# workers can depend on the tunnel, and you can still use foreman locally.

import os
import sys
from tempfile import NamedTemporaryFile
import subprocess

def check_already_running(forwards):
    if sys.platform == 'darwin':
        ssh_args = ['pgrep', '-fl', 'ssh']
    else:
        ssh_args = ['pgrep', '-x', '-a', 'ssh']

    try:
        lines = subprocess.check_output(ssh_args).split('\n')
    except subprocess.CalledProcessError:
        lines = list()

    for line in lines:
        if not line:
            continue
        pid, cmd = line.split(' ', 1)
        pid = int(pid)
        found = False
        for f in forwards:
            if f in cmd:
                found = True
                break
        if found:
            print 'SSH tunnel already running. PID=%d' % pid
            return True
    return False

target = os.environ['SSH_TUNNEL_TARGET']
at = target.find(':')
if at != -1:
    port = int(target[at + 1:])
    target = target[:at]
else:
    port = None

key = os.environ['SSH_TUNNEL_KEY']

forwards = os.environ['SSH_TUNNEL_FORWARDS'].split(',')

type, blob = key.split(':', 1)

out = '-----BEGIN %s PRIVATE KEY-----\n' % type
for n in range(0, ((len(blob) - 1) / 64) + 1):
    out += blob[n*64:(n*64)+64] + '\n'
out += '-----END %s PRIVATE KEY-----\n' % type

f = NamedTemporaryFile(delete=False)
key_file = f.name

try:
    f.write(out)
    f.close()

    args = [
        'ssh',
        '-f',
        '-N',
        '-i', key_file,
        '-o', 'StrictHostKeyChecking=no',
        '-o', 'ExitOnForwardFailure=yes'
    ]

    for f in forwards:
        args.extend(['-L', f])

    if port is not None:
        args.extend(['-p', str(port)])

    args.append(target)

    cmd = ' '.join(args)

    if check_already_running(forwards):
        sys.exit(0)

    print 'Starting SSH tunnel: %s' % cmd

    try:
        subprocess.check_call(args)
    except subprocess.CalledProcessError:
        if not check_already_running(forwards):
            raise
finally:
    os.remove(key_file)