import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from "discord.js";

/**
 * Create link buttons for an entity
 * @param buttons Array of button configurations
 * @returns ActionRowBuilder with link buttons
 */
export function createLinkButtons(
  buttons: {
    label: string;
    url: string | null;
  }[],
): ActionRowBuilder<ButtonBuilder> {
  const row = new ActionRowBuilder<ButtonBuilder>();

  buttons.forEach(({ label, url }) => {
    const button = new ButtonBuilder()
      .setStyle(ButtonStyle.Link)
      .setLabel(label);

    if (url) {
      button.setURL(url);
    }

    if (!url) {
      button.setDisabled(true);
    }

    row.addComponents(button);
  });

  return row;
}

/**
 * Format timestamp relative to current time
 * @param timestamp Timestamp to format
 * @returns Formatted relative timestamp
 */
export function formatRelativeTimestamp(timestamp: number | null): string {
  return timestamp
    ? `<t:${Math.floor(timestamp / 1000)}:R>`
    : "N/a";
}

/**
 * Truncate array with ellipsis
 * @param arr Input array
 * @param limit Maximum number of items to show
 * @returns Truncated array string with ellipsis if over limit, null if empty
 */
export function formatArrayWithEllipsis<T>(
  arr: T[],
  formatter: (item: T) => string,
  limit = 3,
): string | null {
  if (arr.length === 0) return null;

  const formattedItems = arr.map(formatter);
  return formattedItems.length > limit
    ? formattedItems.slice(0, limit).join(", ") + ` (+${formattedItems.length - limit})`
    : formattedItems.join(", ");
}

/**
 * Generate status icon based on boolean
 * @param status Boolean status
 * @returns Emoji string representing the status
 */
export function getStatusIcon(status: boolean): string {
  return status
    ? "<:check:1313589498839306421>"
    : "<:x_:1313589497178488842>";
}
