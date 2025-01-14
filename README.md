![Banner](assets/github-banner.png)

[![Crowdin](https://badges.crowdin.net/meteor-application/localized.svg)](https://crowdin.com/project/meteor-application)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![GitHub stars](https://img.shields.io/github/stars/meteor-discord/application?style=flat&color=yellow)](https://github.com/meteor-discord/application)

## About the project

Meteor is an open-source Discord application that is flexible and easy to use. It includes features that improve server security and enhance the user experience.

The Meteor team is committed to making the application better over time, adding new features based on what users want.

Join the [Discord](https://discord.meteors.cc) server for more information or to participate in the development of Meteor.

### Built with

- [Bun](https://bun.sh/) with [TypeScript](https://www.typescriptlang.org/)
- [Discord.js](https://discord.js.org/)
- [Prisma](https://prisma.io/) with [PostgreSQL](https://www.postgresql.org/)
- [Docker](https://www.docker.com/) with [docker-compose](https://docs.docker.com/compose/)

## Installation

### Prerequisites

- [Discord Application](https://discord.dev/)
- [Bun](https://bun.sh/) installed
- PostgresQL Database
- Cobalt Instance (optional)

> [!TIP]
> On [neon.tech](https://neon.tech/) you can quickly set up a database for free, good for development and testing.

### Usage

1. Clone the repository
2. Install dependencies with `bun install`
3. Create a `.env` file and fill in the variables from `.env.example`
4. Push the database schema to your database with `bun prisma db push`
5. Run the application

```bash
bun start  # without live reloading
bun dev    # with live reloading
```

## Contributing

See the [contributing guide](CONTRIBUTING.md) for details on how to contribute.

### Contributors

<a href="https://github.com/meteor-discord/application/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=meteor-discord/application&max=30" alt="Contributors Image">
</a>

## Support

<a href="https://www.buymeacoffee.com/feenko" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy Me A Coffee" style="height: 41px !important;width: 174px !important;box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;-webkit-box-shadow: 0px 3px 2px 0px rgba(190, 190, 190, 0.5) !important;" ></a>
