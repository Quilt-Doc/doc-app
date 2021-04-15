#!/bin/sh
rm -rf models
rm -rf constants

mkdir -p models
mkdir -p constants

cp -R ../../models/* models/
cp -R ../../constants/* constants/