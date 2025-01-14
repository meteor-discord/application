![Banner](assets/github-banner.png)

[![Crowdin](https://badges.crowdin.net/meteor-application/localized.svg)](https://crowdin.com/project/meteor-application)

## About the project

Meteor is an open-source Discord application that is flexible and easy to use. It includes features that improve server security and enhance the user experience.

The Meteor team is committed to making the application better over time, adding new features based on what users want.

Join the [Discord](https://discord.meteors.cc) server for more information or to participate in the development of Meteor.

### Built with

- [Bun](https://github.com/oven-sh/bun)
- [Discord.js](https://github.com/discordjs/discord.js)
- [Prisma](https://github.com/prisma/prisma) with PostgreSQL
- [Chalk](https://github.com/chalk/chalk)
- [Dprint](https://github.com/dprint/dprint)

## Installation

### Prerequisites

- [Discord Application](https://discord.dev/)
- [Bun](https://bun.sh/)
- PostgresQL Database
- Cobalt Instance (Optional)

> [!TIP]
> On [neon.tech](https://neon.tech/) you can quickly set up a database for free, good for development and testing.

### Usage

1. Clone the repository
2. Install dependencies with `bun install`
3. Fill in the `.env` with data from `.env.example`
   - `DISCORD_TOKEN` is your bot token
   - `DATABASE_URL` is your PostgreSQL database URL
   - `COBALT_API_KEY` is your Cobalt API key (optional)
   - `COBALT_API_URL` is your Cobalt API URL (optional) (defaults to `https://cobalt.meteors.cc/`)
   - `NODE_ENV` is your environment (if you are developing locally, `development` is your way to go)
4. Push the database schema to your database with `bun prisma db push`
5. Run the application

```bash
bun start  # without hot reloading
bun dev    # with hot reloading
```

## Contributing

See the [contributing guide](CONTRIBUTING.md) for details on how to contribute.

### Contributors

<a href="https://github.com/meteor-discord/application/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=meteor-discord/application&max=30" alt="Contributors Image">
</a>
