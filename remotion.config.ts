// remotion.config.ts (only if you need to export transparent videos)
import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('png');  // Updated syntax
Config.setPixelFormat('yuva420p');
Config.setCodec('vp8');