# Maintaining Data <!-- omit in toc -->

When maintaining data, you can refer to the sample data available
as the initial import, see
[this section](./initial-setup-local-dev-env.md#fill-tables-with-initial-data).

You actually only have to manually insert users and task lists.
All the rest is done by the app.

## Table of Contents <!-- omit in toc -->

- [DynamoDB-Tables In General](#dynamodb-tables-in-general)
- [Adding a User](#adding-a-user)
- [Adding a Task List](#adding-a-task-list)
- [Appendix: Table Structure](#appendix-table-structure)
  - [Users](#users)
  - [TaskListMetadata](#tasklistmetadata)
  - [Tasks](#tasks)
  - [Labels](#labels)
  - [Sessions](#sessions)

## DynamoDB-Tables In General

For each environment (`dev`, `uat`, `prod`), there are the following
tables:

- Users
- TaskListMetadata
- Tasks
- Labels
- Sessions

The tables names always have the environment name as a postfix,
e.g. `Users-dev` or `Tasks-prod`.

## Adding a User

If you want to add a user to the app, you have to do this manually:

1. Create a new user in Cognito.
2. Add the user to the `Users` table in DynamoDB, ensuring you include
   the `taskListIds` to grant the user access to the task lists.

## Adding a Task List

To add a task list to the app, you just have to add it to the
`TaskListMetadata` table in DynamoDB.

The value of the field `position` is used to sort the task lists
in the app, starting from 0.

## Appendix: Table Structure

Even though DynamoDB is a NoSQL database, I use it quite a bit like a
relational database.

In the following sections you see which fields are required for each
table.

### Users

- `id` (String, partition key)
- `displayName` (String)
- `taskListIds` (List of Strings): The IDs of the task lists that
  the user has access to. Must have values of `TaskListMetadata.id`.

### TaskListMetadata

- `id` (String, partition key)
- `displayName` (String, sort key)
- `color` (String)
- `position` (Number)

### Tasks

- `id` (String, partition key)
- `boardColumn` (String): Must be one of the values of the
  [`BoardColumn`](../app/types/dataTypes.ts#L38) enum (e.g. `backlog`).
- `listId` (String): Must have a value of `TaskListMetadata.id`.
- `title` (String)
- `details` (String)
- `position` (Number)
- `createdAt` (String)
- `updatedAt` (String)
- `labelIds` (List of Strings): These IDs must have values of
  `Labels.id`.

### Labels

- `id` (String, partition key)
- `color` (String)
- `displayName` (Map of Strings): Keys of this map must be the
  values of [`ALL_LANGUAGES`](../app/utils/language.ts).

### Sessions

- `id` (String, partition key)
- `data` (String)
- `expiresAt` (Number)
