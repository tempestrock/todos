# Initial Setup

User pool and database are AWS-based.
The machine to host the app doesn't need to be AWS-based. In fact, mine is an on-premises
machine.

## AWS

### User Pool

Create a user pool in AWS Cognito. You can use the script `./scripts/create-user-pool.sh`
for that.

`<tbd>`

### Database

Create DynamoDB tables with the script `./scripts/create-db-tables.sh`.

## Production Machine

In my case, the production machine is an on-premises machine which
hosts the app for the UAT as well as the prod environment.

```bash
docker network create todos_network
```
