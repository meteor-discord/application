const fs = require('fs');
const https = require('https');
const path = require('path');

const STATICS_BASE_URL = 'https://bignutty.gitlab.io/webstorage4/v2/assets/';
const ASSETS_DIR = path.join(__dirname, '../assets');

// Read Statics directly from the source file
function getStaticsFromFile() {
  const staticsPath = path.join(__dirname, '../labscore/utils/statics.js');
  const content = fs.readFileSync(staticsPath, 'utf8');

  // Extract the Statics object using regex
  const match = content.match(/const Statics = Object\.freeze\((\{[\s\S]*?\n\})\);/);
  if (!match) {
    throw new Error('Could not find Statics object in statics.js');
  }

  // Use eval to parse the object (safe since it's our own file)
  const staticsObj = eval(`(${match[1]})`);
  return staticsObj;
}

const Statics = getStaticsFromFile();

// Add image_loading_splash files (1-18)
for (let i = 1; i <= 18; i++) {
  Statics.assets[`image_loading_splash_${i}`] = {
    file: `loading/splash_25/${i}.png`,
    revision: 250129,
  };
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
        if (response.statusCode !== 200) {
          reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
          return;
        }
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          resolve();
        });
      })
      .on('error', err => {
        fs.unlink(dest, () => {});
        reject(err);
      });
  });
}

async function downloadAllAssets() {
  const allAssets = new Map();
  const failedDownloads = [];

  // Collect all assets from nested structure, using file path as key to deduplicate
  Object.values(Statics).forEach(category => {
    Object.values(category).forEach(asset => {
      // Skip directory paths (ending with /)
      if (!asset.file.endsWith('/')) {
        allAssets.set(asset.file, asset);
      }
    });
  });

  console.log(`Downloading ${allAssets.size} unique assets...`);

  for (const asset of allAssets.values()) {
    const url = `${STATICS_BASE_URL}${asset.file}?r=${asset.revision}`;
    const dest = path.join(ASSETS_DIR, asset.file);

    // Skip if file already exists
    if (fs.existsSync(dest)) {
      console.log(`○ Skipped (exists): ${asset.file}`);
      continue;
    }

    try {
      console.log(`Downloading: ${asset.file}`);
      await downloadFile(url, dest);
      console.log(`✓ Downloaded: ${asset.file}`);
    } catch (error) {
      console.error(`✗ Failed to download ${asset.file}: ${error.message}`);
      failedDownloads.push({ file: asset.file, url, error: error.message });
    }
  }

  console.log('\n=== Download Complete ===');
  console.log(`Total assets: ${allAssets.size}`);
  console.log(`Failed downloads: ${failedDownloads.length}`);

  if (failedDownloads.length > 0) {
    console.log('\n=== Failed Downloads Report ===');
    failedDownloads.forEach(({ file, url, error }) => {
      console.log(`\n✗ ${file}`);
      console.log(`  URL: ${url}`);
      console.log(`  Error: ${error}`);
    });
  }
}

downloadAllAssets();
