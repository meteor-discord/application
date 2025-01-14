# Contributing to Meteor

Thank you for your interest in contributing to Meteor! Contributions are welcome and appreciated. By contributing, you help us make this project better for everyone.

This document will guide you through the process of contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Bug Reports](#bug-reports)
- [Feature Requests](#feature-requests)
- [Pull Requests](#pull-requests)
- [Development Setup](#development-setup)
- [Coding Standards](#coding-standards)
- [Commit Messages](#commit-messages)

## Code of Conduct

This project and everyone participating in it is governed by the [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior on our [Discord server](https://discord.meteors.cc/).

## Bug Reports

When reporting a bug, please use the GitHub issue template. The template will automatically populate with the required sections when you create a new issue.

To create a bug report:

1. Go to the [Issues](https://github.com/meteor-discord/application/issues) tab
2. Click "New Issue"
3. Select the "Bug Report" template
4. Fill out all required sections
5. Submit the issue

The template will guide you through providing important details like reproduction steps, expected behavior, environment information, and any relevant context needed to investigate the issue.

> [!NOTE]
> Before submitting a new bug report, please search existing issues to avoid duplicates.

## Feature Requests

Feature requests are welcome and help guide the development of Meteor. We categorize feature requests into two types:

### Major Features

For major features that would significantly impact the application's functionality or architecture:

1. Start a discussion first, either:
   - On our [Discord server](https://discord.meteors.cc/) in the appropriate channel
   - Or by creating a detailed Feature Request issue on GitHub
2. Provide clear reasoning for the feature and its benefits
3. Be open to feedback and discussion from the community
4. Wait for consensus from maintainers before starting implementation

### Minor Features

For smaller enhancements that don't require significant architectural changes:

1. You can submit these directly as a Pull Request
2. Include a clear description of the feature in the PR
3. Ensure the implementation follows our [Coding Standards](#coding-standards)
4. Be prepared to make adjustments based on review feedback

> [!TIP]
> Not sure if your feature idea is major or minor? Feel free to ask in our Discord server first.

## Pull Requests

We welcome contributions in the form of Pull Requests! Here's how you can submit your changes:

1. Fork the repository
2. Create a new branch for your changes (e.g. `my-new-feature`)
3. Make your changes following our [Coding Standards](#coding-standards)
4. Submit a Pull Request
5. Wait for the maintainers to review your changes
6. Make any necessary adjustments based on feedback

> [!TIP]
> Before submitting a Pull Request, please ensure your changes are consistent with the project's coding standards and guidelines.

## Development Setup

To set up a development environment, please refer to the [Installation](README.md#installation) section in the README.

## Coding Standards

We use ESLint for linting and dprint for code formatting to maintain consistent code style across the project.

### ESLint

ESLint helps catch potential issues and enforces coding best practices. You can run ESLint in two ways:

1. Via your code editor - Install the ESLint extension to see issues in real-time
2. Via terminal:

```bash
bun lint
```

> [!TIP]
> You can also run `bun lint --fix` to automatically fix linting errors.

### dprint

dprint helps format the code to match our style guidelines. You can run dprint in two ways:

1. Via your code editor - Install the dprint extension to format your code directly in the editor
2. Via terminal:

```bash
bun format
```

## Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification for our commit messages. This helps keep the commit history clean and generates accurate changelogs.

### Format

Each commit message should be structured as follows:

```
<type>(<scope>): <subject>

<body>

<footer>
```

The `<type>` is one of the following:

- `feat`: A new feature
- `fix`: A bug fix
- `perf`: A performance improvement
- `docs`: Documentation changes
- `style`: Code style changes (e.g., formatting)
- `chore`: Routine tasks, maintenance, dependencies
- `refactor`: Code changes that neither fix bugs nor add features
- `test`: Adding or modifying tests

The `<scope>` is optional and should be used if the commit only affects a specific part of the codebase.

The `<subject>` is a short description of the change in lowercase, typically 40 characters or less. it should be in the present tense and describe the change in a single, concise phrase.

The `<body>` is optional and should provide more context about the change. It can include information about why the change was made, how it was tested, or any other relevant details.

The `<footer>` is optional and should contain any additional information that is not covered by the other parts of the commit message. This can include references to related issues, pull requests, co-authors, or other relevant information.

### Examples

- `feat(logger): add silly log level`
- `style: format code`
- `fix(commands/info): fix typo in user subcommand`
- `perf(commands/info): improve user command performance`
- `docs(README): update installation section`
- `chore: update dependencies`
