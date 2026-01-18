#!/usr/bin/env node
/**
 * Script to upload GitHub emoji to Discord server
 * 
 * Usage:
 *   node scripts/upload_github_emoji.js
 * 
 * Requirements:
 *   - Bot token in .env file
 *   - Bot must have MANAGE_EMOJIS_AND_STICKERS permission
 *   - Server must have emoji slots available
 * 
 * This script will:
 *   1. Load emoji images from assets/emojis/
 *   2. Upload them to the Discord server
 *   3. Output the new emoji IDs to update in constants.js
 */

const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const { ShardClient } = require('detritus-client');

const EMOJI_SERVER_ID = process.env.EMOJI_SERVER_ID;
const BOT_TOKEN = process.env.DISCORD_TOKEN;

if (!BOT_TOKEN) {
  console.error('❌ Error: DISCORD_TOKEN not found in .env file');
  process.exit(1);
}

if (!EMOJI_SERVER_ID) {
  console.error('❌ Error: EMOJI_SERVER_ID not found in .env file');
  console.error('   Add EMOJI_SERVER_ID=your_server_id to .env');
  process.exit(1);
}

async function uploadEmoji(client, guildId, name, imagePath) {
  try {
    const imageData = fs.readFileSync(imagePath);
    const base64 = `data:image/png;base64,${imageData.toString('base64')}`;
    
    const guild = client.guilds.get(guildId);
    if (!guild) {
      throw new Error(`Guild ${guildId} not found`);
    }

    const emoji = await client.rest.createGuildEmoji(guildId, {
      name: name,
      image: base64,
    });

    console.log(`✅ Created emoji :${emoji.name}: with ID ${emoji.id}`);
    return emoji;
  } catch (error) {
    console.error(`❌ Failed to create emoji ${name}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 Starting GitHub emoji upload script...\n');

  const client = new ShardClient(BOT_TOKEN, {
    gateway: {
      intents: ['GUILDS', 'GUILD_EMOJIS_AND_STICKERS'],
    },
  });

  await client.run();
  console.log(`✅ Bot connected as ${client.user.tag}\n`);

  // Check if emoji images exist
  const assetsDir = path.join(__dirname, '..', 'assets', 'emojis');
  const githubIconPath = path.join(assetsDir, 'github_icon.png');
  const githubBrandPath = path.join(assetsDir, 'github_brand.png');

  if (!fs.existsSync(githubIconPath)) {
    console.error(`❌ Error: ${githubIconPath} not found`);
    console.error('   Please create the GitHub icon emoji image first.');
    process.exit(1);
  }

  if (!fs.existsSync(githubBrandPath)) {
    console.error(`❌ Error: ${githubBrandPath} not found`);
    console.error('   Please create the GitHub brand emoji image first.');
    process.exit(1);
  }

  // Upload emojis
  console.log('📤 Uploading GitHub emojis...\n');
  
  const iconEmoji = await uploadEmoji(client, EMOJI_SERVER_ID, 'ico_github', githubIconPath);
  const brandEmoji = await uploadEmoji(client, EMOJI_SERVER_ID, 'nxtd_ico_brand_github', githubBrandPath);

  // Output instructions
  console.log('\n' + '='.repeat(70));
  console.log('📝 Update meteor/constants.js with the following:');
  console.log('='.repeat(70) + '\n');

  if (iconEmoji) {
    console.log(`Line 395:`);
    console.log(`  github: '<:ico_github:${iconEmoji.id}>',\n`);
  }

  if (brandEmoji) {
    console.log(`Line 111:`);
    console.log(`  brand_github: '<:nxtd_ico_brand_github:${brandEmoji.id}>',\n`);
  }

  console.log('='.repeat(70) + '\n');

  await client.kill();
  process.exit(0);
}

main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
