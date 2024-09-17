# Peter's ToDo Lists

- 📖 [Remix docs](https://remix.run/docs)

## Development

Run the dev server:

```bash
pnpm dev
```

## Deployment

First, build your app for production:

```bash
pnpm build
```

Then run the app in production mode:

```bash
pnpm start
```

Now you'll need to pick a host to deploy it to.

### DIY

If you're familiar with deploying Node applications, the built-in Remix app server is production-ready.

Make sure to deploy the output of `pnpm build`

- `build/server`
- `build/client`

## Styling

This template comes with [Tailwind CSS](https://tailwindcss.com/) already configured for a simple default starting experience. You can use whatever css framework you prefer. See the [Vite docs on css](https://vitejs.dev/guide/features.html#css) for more information.

## AWS Access

In order for the service to access the DynamoDB, two users have been created in
`AWS-04-services`: `todos-service-uat` and `todos-service-prod`. Their credentials
reside in the `.env` file in the respective directories on `vpn-client-1`.

## Data Model

In DynamoDB, there are the following tables:

 | Table name         | Partition Key | Sort Key | Other Fields  |
 | ------------------ | ------------- | -------- | ------------- |
 | `TaskListMetadata` | `id`          | `name`   | `color`       |
 | `Tasks`            | `listId`      | `id`     | `title`, `details`, `boardColumn`, `createdAt`, `updatedAt`, `labels` |
 | `Users`            | `id`          | (none)   | `displayName`, `taskListIds` |

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
