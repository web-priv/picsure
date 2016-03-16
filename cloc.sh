#!/bin/bash -x 

EXCLUDE_LIST=(
)

(set +x
    echo "======================"
    echo "  SERVER"
    echo "======================"
)

cd $(dirname $0)
cloc --force-lang="Javascript",in --exclude-list-file=<(set +x; for x in ${EXCLUDE_LIST[@]}; do echo "$x"; done) --by-file index.js lib/

cloc --force-lang="Javascript",in --exclude-list-file=<(set +x; for x in ${EXCLUDE_LIST[@]}; do echo "$x"; done) index.js lib/

(set +x
    echo "======================"
    echo "  CLIENT"
    echo "======================"
)

cloc --force-lang="Javascript",in --exclude-list-file=<(set +x; for x in ${EXCLUDE_LIST[@]}; do echo "$x"; done) --by-file cli/js/app/

cloc --force-lang="Javascript",in --exclude-list-file=<(set +x; for x in ${EXCLUDE_LIST[@]}; do echo "$x"; done) cli/js/app/
