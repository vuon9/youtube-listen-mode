const fs = require('fs');

function sync() {
  try {
    const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
    const manifestPath = './manifest.json';
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

    if (manifest.version !== pkg.version) {
      manifest.version = pkg.version;
      fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 4) + '\n');
      console.log(`[YLM] Synced manifest.json version to ${pkg.version}`);
    } else {
      console.log(`[YLM] Version already in sync: ${pkg.version}`);
    }
  } catch (err) {
    console.error('[YLM] Failed to sync version:', err.message);
    process.exit(1);
  }
}

sync();
