import { checkSuperAdmin } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import TicketDashboard from "./TicketDashboard";

export default async function AdminSupportPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) redirect("/");

  const sp = await searchParams;
  const activeTicketId = sp.id || null;

  // 1. Fetch all tickets with last message preview
  const tickets = await prisma.supportTicket.findMany({
    orderBy: { updatedAt: "desc" },
    include: {
      user: true,
      conversations: {
        include: {
          messages: {
            orderBy: { createdAt: "desc" },
            take: 1
          }
        }
      }
    }
  });

  // 2. Fetch active ticket with full conversation
  let activeTicket = null;
  let userIntelligence = null;

  if (activeTicketId) {
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

    // 3. Fetch user intelligence data for the sidebar
    if (activeTicket) {
      const userId = activeTicket.userId;
      const [orders, allTickets] = await Promise.all([
        // Last 5 orders with full context
        prisma.order.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 5,
          include: {
            payments: true,
            refunds: true,
            sellerOrders: {
              include: {
                items: {
                  include: {
                    variant: { include: { product: { select: { title: true } } } }
                  }
                }
              }
            }
          }
        }),
        // All tickets by this user
        prisma.supportTicket.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          select: { id: true, subject: true, status: true, createdAt: true }
        })
      ]);

      userIntelligence = {
        orders: JSON.parse(JSON.stringify(orders)),
        allTickets: JSON.parse(JSON.stringify(allTickets))
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
