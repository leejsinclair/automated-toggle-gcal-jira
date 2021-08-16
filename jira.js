// curl -v https://jira.creditsense.io/rest/api/3/issue/HND-3588 --user lsinclair@creditsense.com.au:DfkEmZI1Tomvd1Ies5Fo6C45
// https://jira.creditsense.io/rest/api/3/issue/HND-3588
const fs = require("fs");
const { JIRA_USERNAME, JIRA_PASSWORD, JIRA_BOARD_ID, JIRA_HOSTNAME } =
  process.env;
const boardId = parseInt(JIRA_BOARD_ID);

const JiraClient = require("jira-connector");
const jira = new JiraClient({
  host: JIRA_HOSTNAME,
  strictSSL: true,
  basic_auth: {
    username: JIRA_USERNAME,
    password: JIRA_PASSWORD,
  },
});

async function getIssues() {
  const sprints = await getSprints();
  const active = sprints.values
    .sort((a, b) => a.id - b.id)
    .filter((s) => s.activatedDate)
    .pop(); // last active
  const issues = await getIssuesForSprint({ boardId, sprintId: active.id });
  const myIssues = issues.issues
    .filter(
      (i) =>
        i.fields &&
        i.fields.assignee &&
        i.fields.assignee.name === JIRA_USERNAME
    )
    .map((i) => i.fields);

  const d = new Date();
  d.setHours(d.getHours() - 18);
  const minTime = d.getTime();

  const todaysIssues = myIssues.filter(
    (i) => new Date(i.updated).getTime() >= minTime
  );

  const timelogData = todaysIssues.map((i) => {
    return {
      summary: i.parent.fields.summary,
      tag: i.parent.key,
    };
  });
  fs.writeFileSync("/tmp/issues.json", JSON.stringify(issues, null, "\t"), {
    encoding: "utf8",
  });
  fs.writeFileSync("/tmp/myIssues.json", JSON.stringify(myIssues, null, "\t"), {
    encoding: "utf8",
  });
  fs.writeFileSync(
    "/tmp/todaysIssues.json",
    JSON.stringify(todaysIssues, null, "\t"),
    { encoding: "utf8" }
  );
  fs.writeFileSync(
    "/tmp/timelogData.json",
    JSON.stringify(timelogData, null, "\t"),
    { encoding: "utf8" }
  );

  fs.writeFileSync("jira.json", JSON.stringify(timelogData, null, "\t"), {
    encoding: "utf8",
  });
}

getIssues();

function getSprints() {
  return new Promise((resolve, reject) => {
    jira.board.getAllSprints(
      {
        boardId,
      },
      function (error, sprints) {
        if (error) {
          reject(error);
        } else {
          resolve(sprints);
        }
      }
    );
  });
}

function getIssuesForSprint({ boardId, sprintId }) {
  return new Promise((resolve, reject) => {
    jira.board.getIssuesForSprint(
      {
        boardId,
        sprintId,
      },
      function (error, issues) {
        if (error) {
          reject(error);
        } else {
          resolve(issues);
        }
      }
    );
  });
}
