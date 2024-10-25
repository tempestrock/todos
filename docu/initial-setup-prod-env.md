# Initial Setup of UAT and Prod Environment <!-- omit in toc -->

## Table of Contents <!-- omit in toc -->

- [Prerequisites](#prerequisites)
- [Setting Up a Machine](#setting-up-a-machine)
  - [Access From the Internet](#access-from-the-internet)
  - [Access From the Local Developer Machine](#access-from-the-local-developer-machine)
  - [Tools on the Production Machine](#tools-on-the-production-machine)
  - [Create Docker Network](#create-docker-network)
  - [Directories and Files](#directories-and-files)
    - [`docker-compose.yaml`](#docker-composeyaml)
    - [`run-app.sh`](#run-appsh)
    - [`.env`](#env)
- [Database](#database)
  - [Create Database Tables](#create-database-tables)
  - [Fill Tables With Initial Data](#fill-tables-with-initial-data)
- [Deploy the App](#deploy-the-app)

## Prerequisites

You should have [set up the local development](./initial-setup-local-dev-env.md) environment by now.

## Setting Up a Machine

The first thing is to have a machine to host the app.

I run the application twice on that machine: once in a `uat` environment (which
stands for 'user acceptance testing' and is essentially where I test the
deployment and the app before setting it live), and once in the actual `prod`
environment.

### Access From the Internet

That machine must be reachable from the internet from the users' perspective.

It should have a domain name, and the domain should be secured by HTTPS,
i.e., with a certificate signed by a trusted CA. This should be available for both
the `uat` and the `prod` environment.

I will not go into all the possible details on how to do that. Personally,
I use an on-premises machine with
[Nginx Proxy Manager](https://nginxproxymanager.com/) which forwards the
requests to `uat` and `prod`, respectively. My domain name is provided by
[MyFritz!](https://en.avm.de/index.php?id=26293) (because my router is
a FritzBox).

An alternative would be to set up an AWS EC2 instance with the domain
being managed by AWS Route 53 and a certificate provided by AWS ACM. The
reverse proxy could be an Nginx on that EC2 instance or
a separate AWS Application Load Balancer. But note that this would be
a more costly way to do it.

### Access From the Local Developer Machine

From the deployment perspective, you need to have access to that machine
via `ssh` from your local developer machine. (A more elegant way would definitely
be to use GitHub actions instead of a script for the deployment, but I skipped
that for the moment.)

### Tools on the Production Machine

My production machine runs Ubuntu and has `docker` and `docker-compose`
installed.

### Create Docker Network

Run

```bash
docker network create todos_network
```

once on that machine.

### Directories and Files

On the production machine, I have a specific user for the application.
In the user's home directory, there is a directory called `todos` which in turn
has the directories `uat` and `prod`.

Each of the two directories has the following three files:

- `docker-compose.yaml`
- `run-app.sh`
- `.env`

The contents are as follows (shown here for the `uat` environment; replace
`uat` with `prod` for the production environment):

#### `docker-compose.yaml`

```yaml
services:
  todos:
    image: todos-uat:0.1.0
    container_name: todos-uat
    restart: unless-stopped
    ports:
      - '8080:8081' # e.g. '8081:8081' for prod
    env_file:
      - .env
    networks:
      - todos_network

networks:
  todos_network:
    external: true
```

As you see, in `uat` the incoming requests are mapped from port 8080 to port 8081.
This is where the reverse proxy or load balancer needs to do the mapping.

#### `run-app.sh`

```bash
#! /usr/bin/env bash

cd $(dirname "${0}")

docker-compose down
docker-compose up -d
```

Make sure to call `chmod +x run-app.sh` once before trying to run it.

#### `.env`

```
ENV_NAME=uat
AWS_REGION=<your AWS region>
AWS_ACCESS_KEY_ID=<access key ID>
AWS_SECRET_ACCESS_KEY=<secret access key>
SESSION_SECRET=<some string>
COGNITO_USER_POOL_ID=<user pool ID>
COGNITO_CLIENT_ID=<app client ID>
```

See the description of the `.env` file
[here](./initial-setup-local-dev-env#env-file) and following
for more details of the contents.

The values of `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
are again coming from a user or a role you defined in your AWS account.
That user or role needs to have write access to your Dynamo DB tables.

That's it for the machine setup.

Again, you can do this in a completely different way. Maybe, you
just want to use the [Dockerfile](../Dockerfile) I implemented and build and
deploy the image yourself.

## Database

### Create Database Tables

Similar to the creation of the tables for the local development environment,
you need to create the database tables for `uat` and `prod`.

On your developer machine, run

```bash
./scripts/create-db-tables.sh --env-name uat
./scripts/create-db-tables.sh --env-name prod
```

To keep things easy, I use the same AWS Cognito user pool for all
environments. But feel free to change that if you want.

### Fill Tables With Initial Data

If you like, you can again fill the database tables with initial data using
the script I prepared. For that, you need to replace the occurrences of the
string '`-dev`' in the `.txt` files in
[the subfolder `initial-data`](../scripts/initial-data/)
with `-uat` or `-prod` as appropriate and then run the script:

```bash
./scripts/import-initial-data.sh
```

(E.g. `labels-dev` needs to become `labels-uat`, etc.)

## Deploy the App

There is a script called [`deploy.sh`](../scripts/deploy.sh) that you can run to
deploy the app if you followed the steps regarding the machine setup above.

Open the script in your editor, find the two lines marked with `CUSTOMIZE_ME`,
and replace the values for the production machine and the corresponding user with
the values of your system.

Run the script as follows:

```bash
./scripts/deploy.sh --env-name uat
```

If everything is set up correctly, you should see the script perform the following
steps:

1. Create a container image on your local machine.
2. Transfer the image to your production machine.
3. Start a container from the transferred image on your production
   machine (`uat` in this case).

You should now be able to access the app under your `uat` domain. 😎

Run the script with `--env-name prod` again and see your result under your
`prod` domain. 🎉

Hope this all worked for you! I realized that it was way more to describe than
I originally thought. Please feel free to share your thoughts with me.
I am really curious to see if there is someone who used my stuff on their
own.
