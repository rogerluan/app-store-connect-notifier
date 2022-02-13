#!/bin/bash
#description  :Скрипт для получения release notes
#author       :Assylkhan Turan
#usage        :sh ci_generate_release_notes.sh GIT_URL GIT_TARGET_BRANCH CI_JIRA_SERVER_HOST CI_JIRA_USERNAME CI_JIRA_PASSWORD
#===================================================================

GIT_URL=$1
GIT_TARGET_BRANCH=$2

CI_JIRA_SERVER_HOST=$3
CI_JIRA_USERNAME=$4
CI_JIRA_PASSWORD=$5

if [ -z $CI_JIRA_SERVER_HOST ] || [ -z $CI_JIRA_USERNAME ] || [ -z $CI_JIRA_PASSWORD ] || [ -z $GIT_URL ] || [ -z $GIT_TARGET_BRANCH ]
then
    echo "ERROR: Please set missing params"
    exit 0
fi

git clone --no-checkout $GIT_URL temp_folder
cd temp_folder

GIT_HEAD_SHA=$(git log -n 1 origin/master --pretty="%h" | cut -f 1)
GIT_TARGET_SHA=$(git log -n 1 origin/$GIT_TARGET_BRANCH --pretty="%h" | cut -f 1)

GIT_MERGE_BASE=$(git merge-base $GIT_HEAD_SHA $GIT_TARGET_SHA | head -c 8)

GIT_MESSAGES=$(git log -n 150 $GIT_TARGET_SHA...$GIT_HEAD_SHA --pretty="%h | %s")
JIRA_TASKS=$(echo $GIT_MESSAGES | grep -Eo "[A-Z]{2,7}\-[0-9]+" | sort | uniq )

matchesStrings=$(echo "${JIRA_TASKS[*]}" )

PYTHON_COLLECT_SCRIPT=../ci_request_jira_tasks.py

GENERATED_CHANGELOG=$(python3 -W ignore $PYTHON_COLLECT_SCRIPT $CI_JIRA_SERVER_HOST $CI_JIRA_USERNAME $CI_JIRA_PASSWORD $matchesStrings)

rm -rf ../temp_folder

echo "$GENERATED_CHANGELOG"