# Code Customization and Development

## Development

Run the dev server:

```bash
pnpm dev
```

## Deployment

Call

```bash
./scripts/deploy.sh -h
```

to see the options on how to deploy the app to `uat`
and/or `prod`.

## AWS Access

In order for the service to access the DynamoDB, two users have been created in
`AWS-04-services`: `todos-service-uat` and `todos-service-prod`. Their credentials
reside in the `.env` file in the respective directories on `vpn-client-1`.

## Data Model

In DynamoDB, there are the following tables:

| Table name         | Partition Key | Sort Key | Other Fields                                                                      |
| ------------------ | ------------- | -------- | --------------------------------------------------------------------------------- |
| `TaskListMetadata` | `id`          | `name`   | `color`                                                                           |
| `Tasks`            | `id`          | (none)   | `title`, `details`, `boardColumn`, `position`, `createdAt`, `updatedAt`, `labels` |
| `Users`            | `id`          | (none)   | `displayName`, `taskListIds` (list of strings)                                    |

They exist three times with an additional postfix `-dev`, `-uat`, and `-prod`,
respectively. You have to create all of them manually (which means that you only
have to define table name, partition key, and sort key).

The tables `TaskListMetadata` and `Users` even have to get manual entries. It
is possible to export and import from one environment to the other, though.

A user has the following structure (in DynamoDB JSON view) e.g.:

```json
{
  "id": {
    "S": "peter"
  },
  "displayName": {
    "S": "Peter"
  },
  "taskListIds": {
    "L": [
      {
        "S": "todos"
      },
      {
        "S": "lets-try"
      }
    ]
  }
}
```

The `id` entry must be equal to the user name in AWS Cognito.

`<tbd>`
