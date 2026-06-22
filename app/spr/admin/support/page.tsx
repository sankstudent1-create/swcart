import { checkSuperAdmin } from "@/app/actions/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import TicketDashboard from "./TicketDashboard";

export default async function AdminSupportPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const isSuperAdmin = await checkSuperAdmin();
  if (!isSuperAdmin) redirect("/");

  const sp = await searchParams;
  const activeTicketId = sp.id || null;

  // 1. Fetch all tickets
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

  // 2. Fetch active ticket conversation if selected
  let activeTicket = null;
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
  }

  // Clean data for client serialization
  const serializedTickets = JSON.parse(JSON.stringify(tickets));
  const serializedActiveTicket = JSON.parse(JSON.stringify(activeTicket));

  return (
    <TicketDashboard 
      tickets={serializedTickets} 
      activeTicket={serializedActiveTicket} 
    />
  );
}
