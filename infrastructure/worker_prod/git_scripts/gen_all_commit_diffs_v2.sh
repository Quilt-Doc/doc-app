#!/bin/bash
git log -p --cc --all --format=format:"New Commit: %H" --ignore-blank-lines --ignore-all-space --ignore-space-change --minimal >> $1