# Todo Lists <!-- omit in toc -->

A small web-based application to manage todo lists.

## Table of Contents <!-- omit in toc -->

- [What This Is](#what-this-is)
  - [Features](#features)
  - [Technical basis](#technical-basis)
- [Architecture](#architecture)
- [Initial Setup of the Local Dev Environment](#initial-setup-of-the-local-dev-environment)
- [Initial Setup of the Prod Environment(s)](#initial-setup-of-the-prod-environments)
- [Deployment](#deployment)
- [Development and Code Customization](#development-and-code-customization)

## What This Is

This is my personal project to handle todo lists. I was unhappy with what was available for free
to manage simple todo lists. So I decided to build my own app.

This comes without any warranty. But feel free to fork, copy, or use the source code in any way you want.  
If you find any bugs, please let me know.

I am happy to support you in the initial setup but please understand that I won't have a lot of time
for code reviews and the like. Instead, I spent some time writing this documentation. I hope you find it useful.

### Features

- See also this little [gallery of screenshots](./docu/gallery.md).
- Web-based, mobile-first.
- An arbitrary number of todo lists can be used. Each list can carry any number of tasks.
- A list has a number of (hard-coded) board columns. In my case, these are `backlog`, `in progress`, and `done`.
  Tasks can be moved between the columns. The names and number of board columns should be easy to customize.
- Tasks can be moved up and down in a column, thereby giving it a priority.
- Tasks have a title and a detailed text. The detailed text can be written in
  basic [Markdown](https://www.markdownguide.org/cheat-sheet/) in order to give it
  a nicer look and feel. Also links can be added in the text this way.
- Localization: Currently, English and German are supported. Other languages should be easily addable.
- Labels:
  - Labels (e.g. something like `Bug`, `Size: S`, `Size: L`, `Learn`, `at home`, `in the garden`, etc.)
    can be created, edited, and deleted.
  - Labels can be localized, i.e., they switch their names when the language
    is changed.
  - Tasks can be assigned labels and - the actual main purpose of the existence
    of labels - filtered according to their labels.
- Users can be assigned todo lists. Different users can have different sets of lists.
- Light and dark mode.

### Technical basis

- Remix application using Vite, TypeScript, Tailwind CSS, and pnpm.
- AWS Cognito for user management.
- AWS DynamoDB for data storage.
- Possibility to develop locally (`dev`), test in a separate environment
  (`uat`), and run in "production" (`prod`).

The initial installation is not fully automated but I hope that this description tells you everything you need.

Some things need to be admninistered manually, e.g. the assignment of users to
todo lists or the creation of new todo lists.

In the code, you will find some `CUSTOMIZE_ME` comments. These are places
where you can use values that make sense for your use case.

## Architecture

If you are interested in setting up the app on your own machines, the
[architecture](./docu/architecure.md) is a good place to start.

## Initial Setup of the Local Dev Environment

If you are still interested in setting up the app on your own machines,
refer to the [hints and scripts](./docu/initial-setup-local-dev-env.md) on how to initially set
your local dev environment up.

## Initial Setup of the Prod Environment(s)

Once your local dev environment is up and running,
you can take the next step and set up your
[production machine with the two environments `uat` and `prod`](./docu/initial-setup-prod-env.md).

## Deployment

`<tbd>, not part of the initial setup.`

## Development and Code Customization

The source code is prepared to be tweaked in some areas. Find more information about
it [here](./docu/code-customization.md).
