#!/bin/bash

# commit hash
# committer date 
# tree hash
# author name
# committer name
# committer email
# subject
# parent hashes
# ref names without the " (", ")" wrapping.

git log --all -M --date=iso --numstat --name-only --format=END%n%H%n%cd%n%T%n%an%n%cn%n%ce%n%s%n%P%n%D