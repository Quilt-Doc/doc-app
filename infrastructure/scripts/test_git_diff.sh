#!/bin/bash

rm -rf *.patch

# --stdout
git format-patch -1 --minimal f79a6afed36e6ee334016fcdd7626e04e64e8609

git diff f79a6afed36e6ee334016fcdd7626e04e64e8609