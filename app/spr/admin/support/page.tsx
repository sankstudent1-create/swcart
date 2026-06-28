import { checkSuperAdmin } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import TicketDashboard from "./TicketDashboard";

export default async function AdminSupportPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) redirect("/");

  const sp = await searchParams;
  const activeTicketId = sp.id || null;

  // 1. Ticket list with last message preview
  const tickets = await prisma.supportTicket.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      user: true,
      conversations: {
        include: {
          messages: { orderBy: { createdAt: "desc" }, take: 1 }
        }
      }
    }
  });

  let activeTicket = null;
  let userIntelligence = null;

  if (activeTicketId) {
    // 2. Full active ticket with conversation
    activeTicket = await prisma.supportTicket.findUnique({
      where: { id: activeTicketId },
      include: {
        user: true,
        conversations: {
          include: {
            messages: {
              orderBy: { createdAt: "asc" },
              include: { sender: true }
            }
          }
        }
      }
    });

    if (activeTicket) {
      const userId = activeTicket.userId;

      // 3. Comprehensive user intelligence data
      const [
        orders,
        allTickets,
        user,
        reviews,
        wallet,
      ] = await Promise.all([
        // All orders with full financial + logistics context
        prisma.order.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 10,
          include: {
            payments: { orderBy: { createdAt: "desc" } },
            refunds: { orderBy: { createdAt: "desc" } },
            trackingHistory: { orderBy: { timestamp: "desc" }, take: 3 },
            assignedWarehouse: { select: { name: true, location: true } },
            deliveryPerson: { include: { user: { select: { name: true, phone: true } }, vehicle: { select: { type: true, licensePlate: true } } } },
            sellerOrders: {
              include: {
                seller: { select: { companyName: true, isVerified: true } },
                items: {
                  include: {
                    variant: {
                      include: {
                        product: { select: { title: true, basePrice: true } }
                      }
                    }
                  }
                }
              }
            }
          }
        }),

        // All support tickets from this user
        prisma.supportTicket.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          select: { id: true, subject: true, status: true, createdAt: true, updatedAt: true }
        }),

        // User profile + address + wallet
        prisma.user.findUnique({
          where: { id: userId },
          select: {
            name: true,
            email: true,
            phone: true,
            createdAt: true,
            roles: { include: { role: true } },
            customerProfile: { include: { addresses: { where: { isDefault: true } } } },
            sellerProfile: { select: { companyName: true, isVerified: true, kycStatus: true } },
          }
        }),

        // User's reviews
        prisma.review.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { product: { select: { title: true } } }
        }),

        // Wallet balance
        prisma.wallet.findUnique({ where: { userId }, select: { balance: true } }),
      ]);

      // 4. Derived analytics / issue detection
      const allPayments = orders.flatMap(o => o.payments);
      const allRefunds = orders.flatMap(o => o.refunds);

      const failedPayments = allPayments.filter(p => p.status === "FAILED");
      const pendingPayments = allPayments.filter(p => p.status === "PENDING");
      const pendingRefunds = allRefunds.filter(r => r.status === "PENDING");
      const approvedRefunds = allRefunds.filter(r => r.status === "APPROVED");

      const NOW = Date.now();
      const DAY = 86400 * 1000;

      const delayedOrders = orders.filter(o =>
        ["PENDING", "PROCESSING"].includes(o.status) &&
        (NOW - new Date(o.createdAt).getTime()) > 3 * DAY
      );

      const stuckShippedOrders = orders.filter(o =>
        o.status === "SHIPPED" &&
        o.trackingHistory.length > 0 &&
        (NOW - new Date(o.trackingHistory[0].timestamp).getTime()) > 5 * DAY
      );

      // Check for seller issues — items from unverified/suspended sellers
      const sellerIssues = orders.flatMap(o =>
        o.sellerOrders
          .filter(so => !so.seller.isVerified)
          .map(so => ({ orderId: o.id, sellerName: so.seller.companyName, status: o.status }))
      );

      // Items summary for each order
      const orderSummaries = orders.map(o => ({
        id: o.id,
        status: o.status,
        totalAmount: o.totalAmount,
        createdAt: o.createdAt.toISOString(),
        trackingNumber: o.trackingNumber,
        payments: o.payments.map(p => ({ id: p.id, method: p.method, status: p.status, amount: p.amount, createdAt: p.createdAt.toISOString() })),
        refunds: o.refunds.map(r => ({ id: r.id, amount: r.amount, status: r.status, reason: r.reason, createdAt: r.createdAt.toISOString() })),
        trackingHistory: o.trackingHistory.map(t => ({ id: t.id, status: t.status, location: t.location, timestamp: t.timestamp.toISOString() })),
        warehouse: o.assignedWarehouse,
        deliveryPerson: o.deliveryPerson ? {
          name: o.deliveryPerson.user.name,
          phone: o.deliveryPerson.user.phone,
          vehicle: o.deliveryPerson.vehicle,
        } : null,
        sellerOrders: o.sellerOrders.map(so => ({
          id: so.id,
          status: so.status,
          payoutStatus: so.payoutStatus,
          seller: so.seller,
          items: so.items.map(it => ({
            id: it.id,
            qty: it.quantity,
            price: it.priceAtBuy,
            title: it.variant.product.title,
          }))
        }))
      }));

      // Build smart issue list
      const detectedIssues: Array<{ severity: "critical" | "warning" | "info"; type: string; detail: string; orderId?: string; paymentId?: string; refundId?: string }> = [];

      if (failedPayments.length > 0) {
        failedPayments.forEach(p => {
          detectedIssues.push({ severity: "critical", type: "PAYMENT_FAILED", detail: `Payment of ₹${p.amount.toLocaleString("en-IN")} via ${p.method} failed`, paymentId: p.id });
        });
      }
      if (pendingPayments.length > 0) {
        pendingPayments.forEach(p => {
          detectedIssues.push({ severity: "warning", type: "PAYMENT_PENDING", detail: `Payment of ₹${p.amount.toLocaleString("en-IN")} via ${p.method} is still pending` });
        });
      }
      if (pendingRefunds.length > 0) {
        pendingRefunds.forEach(r => {
          detectedIssues.push({ severity: "warning", type: "REFUND_PENDING", detail: `Refund of ₹${r.amount.toLocaleString("en-IN")} is awaiting approval${r.reason ? ` — "${r.reason}"` : ""}`, refundId: r.id, orderId: orders.find(o => o.refunds.some(rf => rf.id === r.id))?.id });
        });
      }
      if (delayedOrders.length > 0) {
        delayedOrders.forEach(o => {
          const daysSince = Math.floor((NOW - new Date(o.createdAt).getTime()) / DAY);
          detectedIssues.push({ severity: "critical", type: "ORDER_DELAYED", detail: `Order stuck in ${o.status} for ${daysSince} days`, orderId: o.id });
        });
      }
      if (stuckShippedOrders.length > 0) {
        stuckShippedOrders.forEach(o => {
          const daysSince = Math.floor((NOW - new Date(o.trackingHistory[0].timestamp).getTime()) / DAY);
          detectedIssues.push({ severity: "critical", type: "SHIPMENT_STUCK", detail: `Shipped order with no tracking update for ${daysSince} days`, orderId: o.id });
        });
      }
      if (sellerIssues.length > 0) {
        sellerIssues.forEach(si => {
          detectedIssues.push({ severity: "warning", type: "UNVERIFIED_SELLER", detail: `Order contains items from unverified seller: ${si.sellerName}`, orderId: si.orderId });
        });
      }
      if (approvedRefunds.length > 0) {
        detectedIssues.push({ severity: "info", type: "REFUND_APPROVED", detail: `${approvedRefunds.length} refund(s) have been approved but may still be processing` });
      }

      userIntelligence = {
        orders: JSON.parse(JSON.stringify(orderSummaries)),
        allTickets: JSON.parse(JSON.stringify(allTickets)),
        user: JSON.parse(JSON.stringify(user)),
        reviews: JSON.parse(JSON.stringify(reviews)),
        walletBalance: wallet?.balance ?? 0,
        detectedIssues,
        stats: {
          totalOrders: orders.length,
          totalSpend: orders.filter(o => o.status === "DELIVERED").reduce((s, o) => s + o.totalAmount, 0),
          failedPaymentsCount: failedPayments.length,
          pendingRefundsCount: pendingRefunds.length,
          delayedOrdersCount: delayedOrders.length,
          accountAgeDays: Math.floor((NOW - new Date(user?.createdAt ?? NOW).getTime()) / DAY),
        }
      };
    }
  }

  return (
    <TicketDashboard
      tickets={JSON.parse(JSON.stringify(tickets))}
      activeTicket={JSON.parse(JSON.stringify(activeTicket))}
      userIntelligence={userIntelligence}
    />
  );
}
