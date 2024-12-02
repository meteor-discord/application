import { EmbedBuilder, User } from 'discord.js';

export class Embed extends EmbedBuilder {
  private static readonly DEFAULT_COLOR = 0xe3223b;

  constructor() {
    super();
    this.setColor(Embed.DEFAULT_COLOR);
  }

  /**
   * Sets default embed properties including author information if provided
   * @param author The Discord user to set as the embed author
   */
  setDefaults(author?: User) {
    if (!author) return this;

    const name =
      author.displayName === author.username ? author.username : `${author.username} (${author.displayName})`;

    this.setAuthor({
      name,
      iconURL: author.displayAvatarURL(),
      url: `https://discord.com/users/${author.id}`,
    });

    return this;
  }
}
