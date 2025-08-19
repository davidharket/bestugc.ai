// lib/affiliate-utils.ts
import { PrismaClient } from '@prisma/client'

// Use a singleton pattern for Prisma client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

const prisma = globalForPrisma.prisma ??= new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
})

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Generate a unique affiliate code
export function generateAffiliateCode(name?: string): string {
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase()
  
  if (name) {
    // Create code from name + random suffix
    const cleanName = name.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().substring(0, 6)
    return `${cleanName}${randomSuffix}`.substring(0, 12)
  }
  
  // Fallback to random code
  return `AFF${randomSuffix}`
}

// Create affiliate record for a user
export async function createAffiliate(userId: string, customCode?: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { affiliate: true }
  })

  if (!user) {
    throw new Error('User not found')
  }

  if (user.affiliate) {
    throw new Error('User is already an affiliate')
  }

  // Generate affiliate code
  let affiliateCode = customCode || generateAffiliateCode(user.name || undefined)
  
  // Ensure code is unique
  let attempts = 0
  while (attempts < 10) {
    const existingAffiliate = await prisma.affiliate.findUnique({
      where: { affiliateCode }
    })
    
    if (!existingAffiliate) break
    
    affiliateCode = generateAffiliateCode(user.name || undefined)
    attempts++
  }

  if (attempts >= 10) {
    throw new Error('Could not generate unique affiliate code')
  }

  // Create affiliate record
  const affiliate = await prisma.affiliate.create({
    data: {
      userId,
      affiliateCode,
      commissionRate: 0.10, // 10% default
    }
  })

  // Update user with affiliate code
  await prisma.user.update({
    where: { id: userId },
    data: { affiliateCode }
  })

  return affiliate
}

// Track affiliate click
export async function trackAffiliateClick(
  affiliateCode: string,
  request: {
    ip?: string
    userAgent?: string
    referrer?: string
    landingPage: string
    country?: string
  }
) {
  // Find affiliate
  const affiliate = await prisma.affiliate.findUnique({
    where: { 
      affiliateCode,
      isActive: true
    }
  })

  if (!affiliate) {
    return null
  }

  // Create click record
  const click = await prisma.affiliateClick.create({
    data: {
      affiliateId: affiliate.id,
      affiliateCode,
      ipAddress: request.ip,
      userAgent: request.userAgent,
      referrer: request.referrer,
      landingPage: request.landingPage,
      country: request.country,
    }
  })

  return click
}

// Process signup with affiliate attribution
export async function processAffiliateSignup(userId: string, affiliateCode?: string) {
  if (!affiliateCode) return null

  // Get user details to check if this is a new user
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { 
      id: true, 
      createdAt: true, 
      referredBy: true,
      affiliateCode: true // Check if user is an affiliate themselves
    }
  })

  if (!user) return null

  // Check if user was created recently (within last 10 minutes) - indicates actual signup
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000)
  const isNewUser = user.createdAt > tenMinutesAgo

  if (!isNewUser) {
    console.log('User is not new (created more than 10 minutes ago), skipping affiliate attribution')
    return null
  }

  // Check if user already has been referred
  if (user.referredBy) {
    console.log('User already has referral attribution, skipping')
    return null
  }

  // Find affiliate
  const affiliate = await prisma.affiliate.findUnique({
    where: { 
      affiliateCode,
      isActive: true
    },
    include: {
      user: { select: { id: true } }
    }
  })

  if (!affiliate) return null

  // Prevent self-referral - check if the affiliate is trying to refer themselves
  if (affiliate.user.id === userId) {
    console.log('Preventing self-referral: affiliate trying to refer themselves')
    return null
  }

  // Check if user already has a referral record
  const existingReferral = await prisma.referral.findFirst({
    where: { userId }
  })

  if (existingReferral) {
    console.log('User already has referral record, skipping')
    return existingReferral
  }

  // Create referral record for new user
  const referral = await prisma.referral.create({
    data: {
      affiliateId: affiliate.id,
      userId,
      affiliateCode,
      status: 'PENDING'
    }
  })

  // Update user with referral info
  await prisma.user.update({
    where: { id: userId },
    data: { referredBy: affiliateCode }
  })

  // Mark any recent clicks as converted
  await prisma.affiliateClick.updateMany({
    where: {
      affiliateCode,
      userId: null,
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      }
    },
    data: {
      converted: true,
      userId
    }
  })

  console.log(`Successfully processed affiliate signup for new user ${userId} with affiliate ${affiliateCode}`)
  return referral
}

// Calculate commission for a purchase
export async function calculateCommission(
  userId: string,
  purchaseAmount: number,
  subscriptionId?: string,
  type: 'SIGNUP' | 'RECURRING' | 'ONE_TIME' = 'SIGNUP'
) {
  // Find user's referral
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      referrals: {
        include: { affiliate: true }
      }
    }
  })

  if (!user || !user.referrals.length) {
    return null
  }

  const referral = user.referrals[0] // Get first (should be only one)
  const affiliate = referral.affiliate

  if (!affiliate.isActive) {
    return null
  }

  // Calculate commission amount
  const commissionAmount = purchaseAmount * affiliate.commissionRate

  // Create commission record
  const commission = await prisma.commission.create({
    data: {
      affiliateId: affiliate.id,
      userId,
      referralId: referral.id,
      subscriptionId,
      amount: commissionAmount,
      percentage: affiliate.commissionRate,
      purchaseAmount,
      type,
      status: 'PENDING'
    }
  })

  // Update referral status if first purchase
  if (type === 'SIGNUP' && referral.status === 'PENDING') {
    await prisma.referral.update({
      where: { id: referral.id },
      data: {
        status: 'CONVERTED',
        conversionDate: new Date(),
        firstPurchaseAmount: purchaseAmount
      }
    })
  }

  // Update referral total spent
  await prisma.referral.update({
    where: { id: referral.id },
    data: {
      totalSpent: {
        increment: purchaseAmount
      }
    }
  })

  // Update affiliate earnings
  await prisma.affiliate.update({
    where: { id: affiliate.id },
    data: {
      totalEarnings: {
        increment: commissionAmount
      },
      pendingPayout: {
        increment: commissionAmount
      }
    }
  })

  return commission
}

// Get affiliate statistics
export async function getAffiliateStats(affiliateId: string) {
  const affiliate = await prisma.affiliate.findUnique({
    where: { id: affiliateId },
    include: {
      referrals: {
        include: {
          user: {
            select: { id: true, email: true, name: true, createdAt: true, plan: true }
          }
        }
      },
      commissions: {
        where: { status: { in: ['PENDING', 'APPROVED'] } }
      },
      clicks: true,
      payouts: true
    }
  })

  if (!affiliate) return null

  const totalClicks = affiliate.clicks.length
  const totalSignups = affiliate.referrals.length
  const conversionRate = totalClicks > 0 ? (totalSignups / totalClicks) * 100 : 0
  
  const pendingCommissions = affiliate.commissions
    .filter(c => c.status === 'PENDING')
    .reduce((sum, c) => sum + c.amount, 0)
  
  const approvedCommissions = affiliate.commissions
    .filter(c => c.status === 'APPROVED')
    .reduce((sum, c) => sum + c.amount, 0)

  const totalPayouts = affiliate.payouts
    .filter(p => p.status === 'COMPLETED')
    .reduce((sum, p) => sum + p.amount, 0)

  return {
    affiliate,
    stats: {
      totalClicks,
      totalSignups,
      conversionRate: Math.round(conversionRate * 100) / 100,
      pendingCommissions,
      approvedCommissions,
      totalPayouts,
      totalEarnings: affiliate.totalEarnings,
      availableForPayout: approvedCommissions
    }
  }
}

// Process monthly payouts (admin function)
export async function processMonthlyPayouts(minimumPayout: number = 50) {
  // Get all affiliates with approved commissions >= minimum payout
  const affiliatesWithPayouts = await prisma.affiliate.findMany({
    where: {
      isActive: true,
      commissions: {
        some: {
          status: 'APPROVED',
          payoutId: null
        }
      }
    },
    include: {
      commissions: {
        where: {
          status: 'APPROVED',
          payoutId: null
        }
      },
      user: {
        select: { email: true, name: true }
      }
    }
  })

  const payoutResults = []

  for (const affiliate of affiliatesWithPayouts) {
    const totalAmount = affiliate.commissions.reduce((sum, c) => sum + c.amount, 0)
    
    if (totalAmount >= minimumPayout) {
      // Create payout record
      const payout = await prisma.payout.create({
        data: {
          affiliateId: affiliate.id,
          amount: totalAmount,
          method: affiliate.payoutMethod || 'manual',
          status: 'PENDING'
        }
      })

      // Link commissions to payout
      await prisma.commission.updateMany({
        where: {
          affiliateId: affiliate.id,
          status: 'APPROVED',
          payoutId: null
        },
        data: {
          payoutId: payout.id,
          status: 'PAID'
        }
      })

      // Update affiliate balances
      await prisma.affiliate.update({
        where: { id: affiliate.id },
        data: {
          pendingPayout: {
            decrement: totalAmount
          }
        }
      })

      payoutResults.push({
        affiliate: affiliate.user,
        amount: totalAmount,
        payoutId: payout.id
      })
    }
  }

  return payoutResults
}

export { prisma }