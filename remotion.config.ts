// remotion.config.ts (only if you need to export transparent videos)
import { Config } from '@remotion/cli/config';
import path from 'path';

Config.setVideoImageFormat('png');  // Updated syntax
Config.setPixelFormat('yuva420p');
Config.setCodec('vp8');

// Use a custom launcher script to pass flags
const chromeLauncher = path.join(process.cwd(), 'chromium-launcher.sh');
Config.setBrowserExecutable(chromeLauncher);
