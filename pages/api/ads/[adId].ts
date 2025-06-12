import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]";
import { Inngest } from "inngest";
import { Ad } from "@prisma/client";
import path from "path";
import fs from "fs/promises";

const inngest: Inngest<any> = new Inngest({ id: "ageco" });

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  let session = await getServerSession(req, res, authOptions);

  // --- Test Script Authentication ---
  if (
    process.env.NODE_ENV === 'development' &&
    req.headers['x-test-secret'] === process.env.TEST_SECRET_KEY
  ) {
    const testUser = await prisma.user.findFirst();
    if (!testUser) {
      return res.status(500).json({ message: 'No test user found in database.' });
    }
    session = {
      user: { id: testUser.id, email: testUser.email },
      expires: '2999-01-01T00:00:00.000Z',
    };
  }
  // --- End Test Script Authentication ---

  if (!session?.user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { adId } = req.query;

  if (typeof adId !== "string") {
    return res.status(400).json({ error: "Invalid adId" });
  }

  const ad = (await prisma.ad.findFirst({
    where: { id: adId, userId: session.user.id },
  })) as Ad;

  if (!ad) {
    return res.status(404).json({ error: "Ad not found" });
  }

  if (req.method === "POST") {
    // Cancel
    if (!ad.inngestRunId) {
      return res.status(400).json({ error: "Ad has no running job to cancel" });
    }

    try {
      await inngest.cancel({
        runId: ad.inngestRunId,
      });

      const updatedAd = await prisma.ad.update({
        where: { id: adId },
        data: { status: "CANCELED" },
      });

      return res.status(200).json(updatedAd);
    } catch (error) {
      console.error("Failed to cancel Inngest job", error);
      return res
        .status(500)
        .json({ error: "Failed to cancel ad generation" });
    }
  } else if (req.method === "DELETE") {
    // Delete
    if (ad.videoUrl) {
      try {
        const videoPath = path.join(process.cwd(), "public", ad.videoUrl);
        await fs.unlink(videoPath);
      } catch (error) {
        console.error("Failed to delete video file", error);
        // an error here should not stop us from deleting the ad from the database
      }
    }

    await prisma.ad.delete({ where: { id: adId } });

    return res.status(204).end();
  }

  res.setHeader("Allow", ["POST", "DELETE"]);
  res.status(405).end(`Method ${req.method} Not Allowed`);
} 