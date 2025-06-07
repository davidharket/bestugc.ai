import type { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import { promises as fs } from 'fs';
import fsSync from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';
import sharp from 'sharp';
import { Rembg } from 'rembg';

async function runFFmpeg(args: string[]): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const proc = spawn('ffmpeg', args, { stdio: 'ignore' });
    proc.on('error', reject);
    proc.on('exit', code => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exited with ${code}`));
    });
  });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).end();
  }

  const { videoUrl } = req.body as { videoUrl?: string };
  if (!videoUrl) {
    return res.status(400).json({ error: 'Missing videoUrl' });
  }

  const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bgremove-'));
  const inputPath = path.join(tmpDir, 'input.mp4');
  const framesDir = path.join(tmpDir, 'frames');
  const outDir = path.join(tmpDir, 'out');
  const outputPath = path.join(tmpDir, 'output.webm');
  await fs.mkdir(framesDir);
  await fs.mkdir(outDir);

  const response = await axios.get(videoUrl, { responseType: 'stream' });
  await new Promise<void>((resolve, reject) => {
    const w = fsSync.createWriteStream(inputPath);
    response.data.pipe(w);
    w.on('finish', resolve);
    w.on('error', reject);
  });

  await runFFmpeg(['-i', inputPath, path.join(framesDir, 'frame_%05d.png')]);

  const rembg = new Rembg();
  const files = (await fs.readdir(framesDir)).filter(f => f.endsWith('.png')).sort();
  for (const file of files) {
    const img = sharp(path.join(framesDir, file));
    const out = await rembg.remove(img);
    await out.png().toFile(path.join(outDir, file));
  }

  await runFFmpeg(['-framerate', '30', '-i', path.join(outDir, 'frame_%05d.png'), '-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', outputPath]);

  const publicDir = path.join(process.cwd(), 'public', 'videos');
  if (!fsSync.existsSync(publicDir)) {
    await fs.mkdir(publicDir, { recursive: true });
  }
  const finalName = `cutout-${Date.now()}.webm`;
  await fs.rename(outputPath, path.join(publicDir, finalName));

  res.status(200).json({ cutoutVideoUrl: `/videos/${finalName}` });

  fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
}
