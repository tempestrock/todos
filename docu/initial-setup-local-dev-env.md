# Initial Setup of Local Dev Environment <!-- omit in toc -->

## Table of Contents <!-- omit in toc -->

- [Prerequisites](#prerequisites)
- [Getting the Local Dev Env Up and Running](#getting-the-local-dev-env-up-and-running)
  - [Have AWS Account Ready](#have-aws-account-ready)
  - [Clone This Repo](#clone-this-repo)
  - [.env File](#env-file)
  - [Create User Pool And Intial User](#create-user-pool-and-intial-user)
  - [Create Database Tables](#create-database-tables)
  - [Fill Tables With Initial Data](#fill-tables-with-initial-data)
  - [Start the App](#start-the-app)

## Prerequisites

You should have (or be willing to get) a basic understanding of

- AWS accounts and users
- Docker
- Typescript, Nodejs, React, Vite, and pnpm

Also, `bash` is used to run a few scripts. So we are talking Linux here. 😉  
If you are on a Mac, you're already fine.  
For Windows users, I recommend using
[WSL2](https://learn.microsoft.com/en-us/windows/wsl/install),
e.g. with an Ubuntu 24.04 image. You get it in the Microsoft Store. Altenatively,
you can use the AWS CLI in PowerShell. But then the bash scripts
won't work. A middle ground could be using [GitBash](https://gitforwindows.org/).

## Getting the Local Dev Env Up and Running

For the local development environment, we basically need an AWS account
where we create a user pool (AWS Cognito) and a few database tables
(AWS DynamoDB).

### Have AWS Account Ready

If you don't already have one,
[create an AWS account](https://aws.amazon.com/getting-started/onboarding-to-aws/).

Once that's done, the next step is to get the necessary credentials onto your
local development machine. You can do this either by creating a dedicated user
with the appropriate permissions or by using the
[AWS access portal](https://docs.aws.amazon.com/signin/latest/userguide/iam-id-center-sign-in-tutorial.html)
to copy the credentials of your user directly into your terminal.

In either case, you should end up with the environment variables `AWS_REGION`,
`AWS_ACCESS_KEY_ID`, and `AWS_SECRET_ACCESS_KEY` set on your system. If your
`AWS_ACCESS_KEY_ID` starts with `ASIA`, you're using session-based authentication,
which also requires setting the `AWS_SESSION_TOKEN`.

AWS is a vast platform, so feel free to dive into the details with the extensive
documentation available online.

### Clone This Repo

On your local machine, call

```bash
git clone https://github.com/tempestrock/todos.git
cd todos
```

to get the source code onto your machine.

### .env File

Create a `.env` file in the root of the repo.
Add the first two lines:

```
AWS_REGION=<your AWS region>
SESSION_SECRET=<some string>
```

The region string is something like `us-east-1`, `eu-central-1`,
`ap-southeast-1` etc. The `SESSION_SECRET` is an arbitrary secret string
that is used to encrypt session data.

Don't use `""` or `''` around the values in your `.env` file!

### Create User Pool And Intial User

Create a user pool in AWS Cognito. You can do this either manually (not
recommended) or by using the script I prepared.

Run

```bash
./scripts/create-user-pool.sh <user-pool-name>
```

where `<user-pool-name>` is the name you want to give your user pool. Something
along the lines of `todos` will do for example.

Again, the AWS credentials must be set as environment variables in order for the
script (or to be precise: for the AWS CLI commands in it) to have access
to your AWS account.

Add two more lines to the `.env` file:

```.env
COGNITO_USER_POOL_ID=<user pool ID>
COGNITO_CLIENT_ID=<app client ID>
```

The user pool ID has the format `<your region>_<some string>`, e.g. `eu-central-1_GxLSY1Q47`.  
The app client ID is a string of approx. 26 alphanumeric characters, e.g.
`6lq1m5b1kriompiq9d72a55p9f`.

The script also creates an initial user `riley` with a temporary password
`N0tVeryS4fePW!`. You can use this user to test the app. The password will
need to be changed during the first login, and the app is able to handle that.

### Create Database Tables

Create the necessary DynamoDB tables. You can do this by running
[the script I prepared](../scripts/create-db-tables.sh):

```bash
./scripts/create-db-tables.sh --env-name dev
```

As stated in the [architecture docu](./architecure.md), I distinguish between
`dev`, `uat`, and `prod`. This call creates the tables for the `dev`
environment.

### Fill Tables With Initial Data

In order for you to have an easy start, there is some initial data that you can
add to your tables. Otherwise, it will be hard to guess the correct table structure
and your initial user will not be able to see anything.

Thus, it is a good idea to run the according script:

```bash
./scripts/import-initial-data.sh
```

You guessed it: the AWS credentials must be set as environment variables.

### Start the App

Now that the basic installations are done, you can start the app.

For that, you need `pnpm` installed on your local machine. If you don't have
it, yet, you can install it with `npm install -g pnpm`. However, I recommend
installing [volta](https://docs.volta.sh/guide/getting-started) first and then
using `volta install pnpm` instead.

Once `pnpm` is installed, run

```bash
pnpm dev
```

in the terminal that has the AWS credentials set as environment variables.

You can now open a browser and navigate to http://localhost:5173. If everything
works, you should see the app running which forwards you to the login page.

Login with `riley` and `N0tVeryS4fePW!`. Give `riley` a new password.

Congrats! The first mile stone is done! 🎉
