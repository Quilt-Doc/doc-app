#!/bin/bash

rm -rf ../*.patch

for f in $(git rev-list --all);
# do echo $f
do git show --format=format:"New Commit: %H" --ignore-blank-lines --ignore-all-space --ignore-space-change --minimal $f >> $1
done