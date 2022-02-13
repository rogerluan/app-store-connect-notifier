const moment = require("moment")
const JiraApi = require("jira-client")
require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` })
require("./string-utilities.js")

function postToSlack(message, attachment) {
    const webhook_url = process.env.BOT_SLACK_WEBHOOK_URL
    if (webhook_url) {
        postUsingWebhook(message, webhook_url, [attachment])
    } else {
        const channel = process.env.SLACK_CHANNEL_NAME || "#bitrise-jysan-ios"
        post(message, channel, [attachment])
    }
}

function postToTelegram(version, status, appName) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN
    const chatIds = process.env.TELEGRAM_CHAT_IDS
    if (botToken && chatIds) {
        chatIds.split(",").forEach((chatId) => {
            postUsingBotToken(botToken, chatId, version, status, appName)
        })
    }
}

function postToSlackApp(appInfo, submissionStartDate) {
    const message = `The status of your app *${appInfo.name}* has been changed to *${appInfo.status.formatted()}*`
    const attachment = slackAttachment(appInfo, submissionStartDate)
    postToSlack(message, attachment)
    postToTelegram(appInfo.version, appInfo.status.formatted(), appInfo.name)
}

function postToSlackBuild(appInfo, buildInfo) {
    const message = `The status of build version *${buildInfo.version}* for your app *${appInfo.name}* has been changed to *${buildInfo.status}*`
    const attachment = slackAttachmentBuild(message, appInfo, buildInfo)
    postToSlack(message, attachment)
    postToTelegram(appInfo.version, buildInfo.status, appInfo.name)
}

function postMessageToSlack(message) {
    const webhook_url = process.env.BOT_STATUS_SLACK_WEBHOOK_URL
    if (webhook_url) {
        postUsingWebhook(message, webhook_url, null)
    } else {
        const channel = process.env.BOT_STATUS_SLACK_CHANNEL_NAME
        if (!channel) {
            return
        }
        post(message, channel, null)
    }
}

function post(message, channel, attachments) {
    const { WebClient } = require("@slack/web-api")
    const client = new WebClient(process.env.BOT_API_TOKEN)
    const request = async() => {
        // Post a message to the channel, and await the result.
        // Find more arguments and details of the response: https://api.slack.com/methods/chat.postMessage
        const result = await client.chat.postMessage({
            text: message,
            channel: channel,
            attachments: attachments,
            as_user: true,
        })
        console.log(`Successfully sent message ${result.ts} in conversation ${channel}`)
    }
    request()
}

function postUsingWebhook(message, webhook_url, attachments) {
    var body = {
        "text": message,
        "channel": process.env.SLACK_CHANNEL_NAME || "#bitrise-jysan-ios",
        "username": "App Store",
        "icon_emoji": ":rocket:",
    }

    if (attachments) {
        body["attachments"] = attachments
    }

    const messageRequest = sendSlackMessage(webhook_url, body)
    messageRequest.catch((err) => {
        console.log(err)
    })
}

/**
 * Handles the actual sending request.
 * We're turning the https.request into a promise here for convenience
 * @param webhookURL
 * @param messageBody
 * @return {Promise}
 */
function sendSlackMessage(webhookURL, messageBody) {
    const https = require("https")
    // Make sure the incoming message body can be parsed into valid JSON
    try {
        messageBody = JSON.stringify(messageBody)
    } catch (e) {
        throw new Error("Failed to stringify messageBody", e)
    }

    // Promisify the https.request
    return new Promise((resolve, reject) => {
        const requestOptions = {
            method: "POST",
            header: {
                "Content-Type": "application/json"
            }
        }

        // Actual request
        const req = https.request(webhookURL, requestOptions, (res) => {
            let response = ""

            res.on("data", (d) => {
                response += d
            })

            // Response finished, resolve the promise with data
            res.on("end", () => {
                resolve(response)
            })
        })

        // There was an error, reject the promise
        req.on("error", (e) => {
            reject(e)
        })

        // Send the message body that we already parsed to JSON
        req.write(messageBody)
        req.end()
    })
}

async function postUsingBotToken(token, chatId, version, status, appName) {
    const https = require("https")
    const jira = new JiraApi({
        protocol: 'https',
        host: process.env.ATLASSIAN_HOST,
        username: process.env.ATLASSIAN_USERNAME,
        password: process.env.ATLASSIAN_TOKEN,
        apiVersion: '2',
        strictSSL: true
      })

    var message = `Статус вашего приложения *${appName}* с версией *${version}* был изменен на *${status}*`

    if (status === "PROCESSING" || status === "VALID") {
        var lastVersionNumber = 0
        await jira.searchJira(`summary ~ "release ios"`)
        .then((response) => {
            var issue = null
            response.issues.forEach((tempIssue) => {
                const matchedVersion = tempIssue.fields.summary.match(/[\d.]*\d+/)
                if (matchedVersion != null) {
                    if (matchedVersion.includes(version)) {
                        issue = tempIssue
                        lastVersionNumber = 0
                    }
                    var versionNumber = parseFloat(matchedVersion[0])
                    if (versionNumber != NaN && lastVersionNumber < versionNumber) {
                        lastVersionNumber = versionNumber
                    }
                }
            })
            if (issue != null) {
                message += `\n\nЗадачи которые входят в релиз:\n${issue.fields.description}`
            }
        })
        if (lastVersionNumber != 0) {
            const resultMessage = await checkAndCreateReleaseIssue(jira, 2.68)
            if (resultMessage.length > 0) {
                message += `\n\nЗадачи которые входят в релиз:\n${resultMessage}`
            }
        }
    }

    message += "\n\nДля получения более подробной информаций перейдите на @strong\\_manager\\_bot"

    const req = https.request(`https://api.telegram.org/bot${token}/sendMessage?chat_id=${chatId}&text=${encodeURI(message)}&parse_mode=markdown`)
    req.end()
}

async function checkAndCreateReleaseIssue(jira, lastVersion) {
    const notes = await execShellCommand(`sh ci_generate_release_notes.sh ${process.env.GIT_CLONE_URL} release/${lastVersion} https://${process.env.ATLASSIAN_HOST} ${process.env.ATLASSIAN_USERNAME} ${process.env.ATLASSIAN_TOKEN}`)
    if (notes.length > 0) {
        const issue = {
            "fields": {
              "project": {
                "id": "10221" // JSN
              },
              "summary": "[release][ios] " + lastVersion,
              "issuetype": {
                "id": "10226" // Task
              },
              "assignee": {
                "name": "Azamat Kalmurzayev"
              },
              "priority": {
                "id": "2" // Hight
              },
              "labels": ["release-task"],
              "description": notes,
            }
        }
        jira.addNewIssue(issue)
        .then((response) => {
            console.log(response)
        })
        .catch((err) => {
            conoso.warn(err)
        })
        return notes
    }
    return ""
}

function slackAttachment(appInfo, submissionStartDate) {
    const attachment = {
        "fallback": `The status of your app ${appInfo.name} has been changed to ${appInfo.status.formatted()}`,
        "color": colorForStatus(appInfo.status),
        "title": "App Store Connect",
        "author_name": appInfo.name,
        "author_icon": appInfo.iconUrl,
        "title_link": `https://appstoreconnect.apple.com/apps/${appInfo.appId}/appstore`,
        "fields": [
            {
                "title": "Version",
                "value": appInfo.version,
                "short": true
            },
            {
                "title": "Status",
                "value": appInfo.status.formatted(),
                "short": true
            }
        ],
        "footer": "Powered by STRONG",
        "ts": new Date().getTime() / 1000
    }

    // Set elapsed time since "Waiting For Review" start
    if (submissionStartDate && appInfo.status != "PREPARE_FOR_SUBMISSION" && appInfo.status != "WAITING_FOR_REVIEW") {
        const elapsedHours = moment().diff(moment(submissionStartDate), "hours")
        // FIXME: Commented out for now until we find a reliable way to implement "Elapsed Time".
        //        Right now, if the bot reboots in-between status checks in Heroku, the "waiting for review"
        //        start time will be lost, thus making the "Elapsed Time" shorter than it actually was.
        console.log(`Here's where we'd add 'Elapsed Time' (${elapsedHours} hours) to the attachment, but this feature has been temporarily disabled.`)
        // attachment["fields"].push({
        //     "title": "Elapsed Time",
        //     "value": `${elapsedHours} hours`,
        //     "short": true
        // })
    }
    return attachment
}

/**
 * Executes a shell command and return it as a Promise.
 * @param cmd {string}
 * @return {Promise<string>}
 */
function execShellCommand(cmd) {
    const exec = require('child_process').exec;
    return new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
            if (error) {
                console.warn(error);
                resolve("")
                return
            }
            if (stdout) {
                resolve(stdout)
            } else {
                console.warn(stderr)
                resolve("")
            }
        });
    });
}

function slackAttachmentBuild(fallback, appInfo, buildInfo) {
    const attachment = {
        fallback,
        "color": colorForStatus(buildInfo.status),
        "title": "App Store Connect",
        "author_name": appInfo.name,
        "author_icon": appInfo.iconUrl,
        "title_link": `https://appstoreconnect.apple.com/apps/${appInfo.appId}/appstore`,
        "fields": [
            {
                "title": "Build Version",
                "value": buildInfo.version,
                "short": true
            },
            {
                "title": "Build Status",
                "value": buildInfo.status,
                "short": true
            },
            {
                "title": "Version",
                "value": appInfo.version,
                "short": true
            },
            {
                "title": "App Status",
                "value": appInfo.status.formatted(),
                "short": true
            }
        ],
        "footer": "Powered by STRONG",
        "ts": new Date().getTime() / 1000
    }

    return attachment
}

function colorForStatus(status) {
    const infoColor = "#8e8e8e"
    const warningColor = "#f4f124"
    const successColor1 = "#1eb6fc"
    const successColor2 = "#14ba40"
    const failureColor = "#e0143d"
    const colorMapping = {
        // App
        "PREPARE_FOR_SUBMISSION" : infoColor,
        "WAITING_FOR_REVIEW" : successColor1,
        "IN_REVIEW" : successColor1,
        "PENDING_CONTRACT" : warningColor,
        "WAITING_FOR_EXPORT_COMPLIANCE" : warningColor,
        "PENDING_DEVELOPER_RELEASE" : successColor2,
        "PROCESSING_FOR_APP_STORE" : successColor2,
        "PENDING_APPLE_RELEASE" : successColor2,
        "READY_FOR_SALE" : successColor2,
        "REJECTED" : failureColor,
        "METADATA_REJECTED" : failureColor,
        "REMOVED_FROM_SALE" : failureColor,
        "DEVELOPER_REJECTED" : failureColor,
        "DEVELOPER_REMOVED_FROM_SALE" : failureColor,
        "INVALID_BINARY" : failureColor,

        // Build
        "PROCESSING" : infoColor,
        "FAILED" : failureColor,
        "INVALID" : failureColor,
        "VALID" : successColor2,
    }
    return colorMapping[status]
}

module.exports = {
    slackApp: postToSlackApp,
    slackBuild: postToSlackBuild,
    slackMessage: postMessageToSlack,
    telegramMessage: postToTelegram,
}
