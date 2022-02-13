#!/usr/bin/python
# -*- coding: UTF-8 -*-
#      
#description    :CI скрипт для подготовления текста Changelog на основе переданных параметров и Jira credentials
#author         :Azamat Kalmurzayev
#usage          :python ci_request_jira_tasks.py JIRA_HOST JIRA_ID JIRA_PWD (resolved/unresolved/all) ABC-1 ABC-2 ...
#===================================================================

import sys
import requests

# ------------------------- Jira project constant values --------------------------
jira_bugfix_type = '10227'
jira_technical_task_type = 'technical_type'
jira_technical_task_label = 'Technical'
jira_issue_resolution_flag_all = 'all'
jira_issue_resolution_flag_unresolved = 'unresolved'
jira_issue_resolution_flag_resolved = 'resolved'

# --------------------------------- Helper functions -----------------------------------

# Requests Jira issue through API and returns a tuple (TASK_TYPE, TASK_TITLE, TASK_RESOLUTION_FLAG)
def get_jira_task_name(jira_server, jira_user, jira_pw, jira_key):
    url = jira_server + '/rest/api/2/issue/' + jira_key
    try:
        req = requests.get(url, auth=(jira_user, jira_pw), verify=False)
        if not req.status_code in range(200,206):
            return [jira_bugfix_type, 'title unavailable, go to Jira site', False]
            sys.exit()
        jira = req.json()
        task_is_resolved = jira["fields"]["resolution"] != None
        task_type = jira["fields"]["issuetype"]["id"]
        task_labels = jira["fields"]["labels"]
        task_name = jira["fields"]["summary"]
        if not (task_type == jira_bugfix_type) and jira_technical_task_label in task_labels:
            task_type = jira_technical_task_type

        return [task_type, task_name, task_is_resolved]
    except requests.exceptions.Timeout:
        return [jira_bugfix_type, 'title unavailable, request timeout', False]
    except requests.exceptions.RequestException as exep:
        # catastrophic error. bail.
        print('error connecting to jira: ' + str(exep))
        return [jira_bugfix_type, 'title unavailable, jira connection error', False]
        

# -------------------- Extracting script argument values ------------------------
jira_server_arg = sys.argv[1]
jira_user_arg = sys.argv[2]
jira_password_arg = sys.argv[3]
jira_key_arg_strings = sys.argv[4:]

# -------------------- Running Jira task fetching procedure ------------------------

extracted_features = []
extracted_tech_tasks = []
extracted_bugfixes = []
for jira_key_arg in jira_key_arg_strings:
    jira_name_type_resolution = get_jira_task_name(jira_server_arg, jira_user_arg, jira_password_arg, jira_key_arg)
    task_res_flag = jira_name_type_resolution[2]
    task_string = "{}: {}".format(jira_key_arg, jira_name_type_resolution[1])
    if jira_name_type_resolution[0] == jira_bugfix_type:
        extracted_bugfixes.append(task_string)
    elif jira_name_type_resolution[0] == jira_technical_task_type:
        extracted_tech_tasks.append(task_string)
    else:
        extracted_features.append(task_string)

# Constructing output text with 3 issue groups
output_string = ''
if len(extracted_features) > 0:
    output_string = "What's new:\n\n"
    output_string = output_string + '\n'.join(extracted_features)

if len(extracted_bugfixes) > 0:
    output_string = output_string + '\n\nFixes:\n\n'
    output_string = output_string + '\n'.join(extracted_bugfixes)

if len(extracted_tech_tasks) > 0:
    output_string = output_string + '\n\nTech-maintenance tasks:\n\n'
    output_string = output_string + '\n'.join(extracted_tech_tasks)

print(output_string)
