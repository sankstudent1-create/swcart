import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";

const MAX_ALLOWED_IPS = 3;

/**
 * Logs a digital access event and runs a heuristic to check for suspicious activity,
 * such as accessing from too many distinct IPs.
 */
export async function logAndCheckDigitalAccess({
  req,
  userId,
  productId,
  action,
  metadata = {},
}: {
  req: NextRequest;
  userId: string;
  productId: string;
  action: string;
  metadata?: Record<string, any>;
}) {
  const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown";
  const ua = req.headers.get("user-agent") || "unknown";

  const enrichedMetadata = { ...metadata, ip, ua };

  // Log the primary action
  await prisma.digitalAccessLog.create({
    data: {
      userId,
      productId,
      action,
      metadata: enrichedMetadata,
    },
  }).catch(() => {}); // non-fatal

  // Run heuristic: check how many distinct IPs this user has used to access this product in the last 7 days
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentLogs = await prisma.digitalAccessLog.findMany({
      where: {
        userId,
        productId,
        createdAt: { gte: sevenDaysAgo },
        action: { not: "SUSPICIOUS" },
      },
      select: { metadata: true },
    });

    const uniqueIps = new Set<string>();
    recentLogs.forEach((log) => {
      const meta = log.metadata as any;
      if (meta && meta.ip && meta.ip !== "unknown") {
        uniqueIps.add(meta.ip);
      }
    });

    // If they exceeded threshold, create a SUSPICIOUS log
    if (uniqueIps.size > MAX_ALLOWED_IPS) {
      // Check if we already logged a suspicious event recently so we don't spam
      const recentSuspicious = await prisma.digitalAccessLog.findFirst({
        where: {
          userId,
          productId,
          action: "SUSPICIOUS",
          createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }, // last 24h
        },
      });

      if (!recentSuspicious) {
        await prisma.digitalAccessLog.create({
          data: {
            userId,
            productId,
            action: "SUSPICIOUS",
            metadata: {
              reason: "Multiple distinct IPs detected",
              uniqueIpCount: uniqueIps.size,
              ips: Array.from(uniqueIps),
              triggerIp: ip,
              triggerUa: ua,
            },
          },
        });
      }
    }
  } catch (error) {
    console.error("Heuristic check failed:", error);
  }
}
