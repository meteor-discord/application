const fs = require('fs');
const https = require('https');
const path = require('path');

const EMOJI_CDN_BASE = 'https://cdn.discordapp.com/emojis/';
const EMOJIS_DIR = path.join(__dirname, '../assets/emojis');

// Read emoji IDs from constants files
function getEmojiIdsFromFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  // Match all custom emoji patterns: <:name:id> or <a:name:id>
  const emojiRegex = /<a?:[^:]+:(\d{17,19})>/g;
  const emojiIds = new Set();

  let match;
  while ((match = emojiRegex.exec(content)) !== null) {
    emojiIds.add(match[1]);
  }

  return emojiIds;
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const file = fs.createWriteStream(dest);
    https
      .get(url, response => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          // Follow redirect
          https
            .get(response.headers.location, redirectResponse => {
              if (redirectResponse.statusCode !== 200) {
                reject(new Error(`Failed to download ${url}: ${redirectResponse.statusCode}`));
                return;
              }
              redirectResponse.pipe(file);
              file.on('finish', () => {
                file.close();
                resolve();
              });
            })
            .on('error', err => {
              fs.unlink(dest, () => {});
              reject(err);
            });
        } else if (response.statusCode === 200) {
          response.pipe(file);
          file.on('finish', () => {
            file.close();
            resolve();
          });
        } else {
          reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        }
      })
      .on('error', err => {
        fs.unlink(dest, () => {});
        reject(err);
      });
  });
}

async function downloadAllEmojis() {
  const allEmojiIds = new Set();
  const failedDownloads = [];

  // Collect emoji IDs from both constants files
  const charmerConstantsPath = path.join(__dirname, '../charmer/constants.js');
  const labscoreConstantsPath = path.join(__dirname, '../labscore/constants.js');

  console.log('Scanning for emoji IDs...');

  if (fs.existsSync(charmerConstantsPath)) {
    const charmerIds = getEmojiIdsFromFile(charmerConstantsPath);
    console.log(`Found ${charmerIds.size} emojis in charmer/constants.js`);
    charmerIds.forEach(id => allEmojiIds.add(id));
  }

  if (fs.existsSync(labscoreConstantsPath)) {
    const labscoreIds = getEmojiIdsFromFile(labscoreConstantsPath);
    console.log(`Found ${labscoreIds.size} emojis in labscore/constants.js`);
    labscoreIds.forEach(id => allEmojiIds.add(id));
  }

  console.log(`\nDownloading ${allEmojiIds.size} unique emojis...`);

  for (const emojiId of allEmojiIds) {
    const url = `${EMOJI_CDN_BASE}${emojiId}.png?size=4096`;
    const dest = path.join(EMOJIS_DIR, `${emojiId}.png`);

    // Skip if file already exists
    if (fs.existsSync(dest)) {
      console.log(`○ Skipped (exists): ${emojiId}.png`);
      continue;
    }

    try {
      console.log(`Downloading: ${emojiId}.png`);
      await downloadFile(url, dest);
      console.log(`✓ Downloaded: ${emojiId}.png`);
    } catch (error) {
      console.error(`✗ Failed to download ${emojiId}.png: ${error.message}`);
      failedDownloads.push({ id: emojiId, url, error: error.message });
    }
  }

  console.log('\n=== Download Complete ===');
  console.log(`Total emojis: ${allEmojiIds.size}`);
  console.log(`Failed downloads: ${failedDownloads.length}`);

  if (failedDownloads.length > 0) {
    console.log('\n=== Failed Downloads Report ===');
    failedDownloads.forEach(({ id, url, error }) => {
      console.log(`\n✗ ${id}.png`);
      console.log(`  URL: ${url}`);
      console.log(`  Error: ${error}`);
    });
  }
}

downloadAllEmojis();
