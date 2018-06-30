#!/bin/bash
# Run End to End tests on non-pull requests
# https://docs.travis-ci.com/user/pull-requests/#Pull-Requests-and-Security-Restrictions
if [ "$TRAVIS_PULL_REQUEST" = "false" ] || [ "$TRAVIS_PULL_REQUEST_SLUG" = "MoveOnOrg/Spoke" ]; then
  npm run dev-nowrap &
  sleep 120
  # TODO: Grep stdout or something to determine that the server is active. Or do this in the test setup.
  npm run test-e2e --saucelabs
fi