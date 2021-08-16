require("dotenv").config();
const togglClient = require("toggl-client");
const apiToken = process.env.API_TOKEN;
const toggl = togglClient({ apiToken });
const axios = require("axios");
const { Base64 } = require("js-base64");
const token = Base64.encode(`${apiToken}:api_token`);
const moment = require("moment");

const jira = require("./jira.json");
var currentJira = -1;

const processingDateStr = process.argv[2] || new Date().toISOString();
const processingDate = moment(processingDateStr.split("T")[0]);

// console.log(offset)

// process.exit()

const lunch = {
  summary: "Lunch",
  start: moment(processingDate).hour("12"),
  end: moment(processingDate).hour("12").minute(30),
};

const eod = {
  summary: "EOD",
  start: moment(processingDate).hour("17").minute(30),
  end: moment(processingDate).hour("17").minute(30),
};

console.log(lunch);
console.log(eod);
// process.exit()

const calendar = require("./calendar.json")
  .map((c) => {
    return {
      summary: c.summary,
      start: moment(c.start),
      end: moment(c.end),
    };
  })
  .concat(lunch)
  .concat(eod)
  .sort((a, b) => a.start.valueOf() - b.start.valueOf());

const timesheet = [];
let start = 0;
let end = 0;

for (var i = 0; i < calendar.length - 1; i++) {
  start = calendar[i].end;
  end = calendar[i + 1].start;
  skip = end.diff(start) === 0;

  if (calendar[i].summary !== "Lunch") {
    timesheet.push({ ...calendar[i], type: "Meeting" });
  }

  if (!skip) {
    const jiraIssue = getNextJira();
    timesheet.push({
      summary: jiraIssue.summary,
      tag: jiraIssue.tag,
      type: "Development",
      start,
      end,
    });
  }
}

// console.log(timesheet);

(async function main() {
  try {
    // api.track.toggl.com
    const { data: user } = await axios(
      "https://api.track.toggl.com/api/v8/me?with_related_data=true",
      {
        responseType: true,
        headers: { authorization: `Basic ${token}` },
      }
    );
    const {
      data: { projects: myProjects, tags, time_entries, workspaces, clients },
    } = user;
    const projects = myProjects.concat(
      (
        await Promise.all(
          clients.map(async (c) => {
            return await toggl.clients.projects(c.id, "both");
          })
        )
      ).flat()
    );
    // console.log(clients, projects, workspaces, tags);
    // console.log(projects);
    // console.log(time_entries);

    const logs = timesheet.map((s) => formatTimelog(s, projects));
    await Promise.all(logs.map((l) => saveLog(l)));
    console.log(JSON.stringify(logs, null, "  "));
  } catch (e) {
    console.error(e);
  }
})();

function getNextJira() {
  currentJira += 1;

  if (currentJira >= jira.length) {
    currentJira = 0;
  }

  // console.log(jira, currentJira)

  return jira[currentJira];
}

async function checkTag(tag, tags) {
  const exists = tags.find((t) => t.name === tag);

  if (!exists) {
  }
}

function formatTimelog(log, projects) {
  const end = log.end.toISOString();
  const start = log.start.toISOString();
  const duration = Math.round(log.end.diff(start) / 1000);
  return {
    description: log.summary,
    tags: log.tag ? [log.tag] : [],
    duration,
    end,
    start,
    pid: findProject(log, projects),
    created_with: "node",
  };
}

function findProject(log, projects) {
  if (log.summary.indexOf("Playback") >= 0) {
    return 155813612;
  }
  if (log.summary.indexOf("User Story improvement") >= 0) {
    return 155813617;
  }
  if (log.summary.indexOf("SU -") >= 0) {
    return 155813615;
  }

  if (log.type === "Meeting") {
    return 155813619;
  }

  return 155813607;
}

async function saveLog(log) {
  toggl.timeEntries.create(log);
  await delay(10000);
}

function delay(t, val) {
  return new Promise(function (resolve) {
    setTimeout(function () {
      resolve(val);
    }, t);
  });
}
