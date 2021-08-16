# Environmental variables

```
# TOGGLE API TOKEN
API_TOKEN=

# GOOGLE CLIENT API ID/SECRET
GOOGLE_CLIENT_ID=
GOOGLE_SECRET=

# JIRA CREDENTIALS
JIRA_USERNAME=
JIRA_PASSWORD=

# JIRA HOST
JIRA_HOSTNAME=

# JIRA BOARD TO READ FROM, will be a number
JIRA_BOARD_ID=
```

# jira.json

```json
tee -a jira.json > /dev/null <<EOT
[
  {
    "summary": "My story name",
    "tag": "TICKET_REF"
  }
]
EOT
```

# Running it

```bash
./do 2021-01-05
```
