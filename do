#!/bin/bash
echo $1
nano jira.json
node calendar.js $1
node index.js $1
