#!/bin/bash
/usr/bin/google-chrome-stable "$@" --no-sandbox --disable-dev-shm-usage --disable-software-rasterizer --enable-gpu-rasterization --force-gpu-mem-available-mb=4096 --enable-accelerated-video-decode
