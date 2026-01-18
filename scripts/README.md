# GitHub Emoji Upload Guide

This guide explains how to upload the GitHub emoji to your Discord server and update the bot configuration.

## Overview

The bot uses custom Discord emojis for branding. After migrating from GitLab to GitHub, we need to create new GitHub emoji and update the emoji IDs in the code.

## Files Created

- `assets/emojis/github_icon.png` - Standard GitHub icon emoji (128x128 PNG)
- `assets/emojis/github_brand.png` - Brand GitHub icon emoji (128x128 PNG)
- `scripts/upload_github_emoji.js` - Automated upload script

## Method 1: Automated Upload (Recommended)

### Prerequisites

1. Bot token in `.env` file (`DISCORD_TOKEN`)
2. Add your emoji server ID to `.env`:
   ```
   EMOJI_SERVER_ID=your_server_id_here
   ```
3. Bot must have `MANAGE_EMOJIS_AND_STICKERS` permission
4. Server must have available emoji slots

### Steps

1. Install dependencies:
   ```bash
   pnpm install
   ```

2. Run the upload script:
   ```bash
   node scripts/upload_github_emoji.js
   ```

3. The script will output the new emoji IDs. Update `meteor/constants.js`:
   - Line 111: Update `brand_github` emoji ID
   - Line 395: Update `github` emoji ID

4. Rename the emoji files to match their IDs:
   ```bash
   mv assets/emojis/github_icon.png assets/emojis/NEW_ICON_ID.png
   mv assets/emojis/github_brand.png assets/emojis/NEW_BRAND_ID.png
   ```

## Method 2: Manual Upload

If the automated script doesn't work, you can upload manually:

### Steps

1. Open Discord and navigate to your emoji server
2. Go to Server Settings → Emoji
3. Click "Upload Emoji"
4. Upload `assets/emojis/github_icon.png` with name `ico_github`
5. Upload `assets/emojis/github_brand.png` with name `nxtd_ico_brand_github`
6. Copy the emoji IDs (right-click emoji → Copy Link, ID is in the URL)
7. Update `meteor/constants.js`:
   ```javascript
   // Line 111
   brand_github: '<:nxtd_ico_brand_github:YOUR_BRAND_ID>',
   
   // Line 395
   github: '<:ico_github:YOUR_ICON_ID>',
   ```
8. Rename the files in `assets/emojis/` to match the new IDs

## Verification

After uploading and updating the IDs:

1. Restart the bot
2. Run the `invite` or `stats` command
3. Verify the GitHub icon appears correctly in the embed

## Troubleshooting

**Error: Bot doesn't have permissions**
- Ensure the bot has `MANAGE_EMOJIS_AND_STICKERS` permission
- Check that you're using the correct server ID

**Error: Server emoji slots full**
- Remove unused emojis or upgrade to a higher boost tier
- Consider using a dedicated emoji server

**Emoji not appearing**
- Clear Discord cache
- Verify the emoji ID is correct in constants.js
- Check that the emoji hasn't been deleted from the server

## Notes

- The generated images are placeholder circles with "GH" text
- For production, consider using official GitHub brand assets
- GitHub brand guidelines: https://github.com/logos
