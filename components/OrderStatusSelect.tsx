"use client";
import { useTransition } from "react";
import { updateOrderStatusAction } from "@/app/actions/admin";
import { toast } from "sonner";

export default function OrderStatusSelect({ orderId, currentStatus }: { orderId: string, currentStatus: string }) {
  const [isPending, startTransition] = useTransition();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value;
    startTransition(async () => {
      const res = await updateOrderStatusAction(orderId, newStatus);
      if (res.success) {
        toast.success(`Order updated to ${newStatus}`);
      } else {
        toast.error("Failed to update status");
      }
    });
  };

  return (
    <select 
      className={`form-select form-select-sm fw-bold rounded-pill shadow-sm border-2 ${currentStatus === 'DELIVERED' ? 'border-success text-success bg-success bg-opacity-10' : currentStatus === 'CANCELLED' ? 'border-danger text-danger bg-danger bg-opacity-10' : 'border-warning text-warning bg-warning bg-opacity-10'}`} 
      value={currentStatus} 
      onChange={handleChange}
      disabled={isPending}
      style={{ cursor: "pointer", maxWidth: "150px" }}
    >
      <option value="PENDING">PENDING</option>
      <option value="PAID">PAID</option>
      <option value="SHIPPED">SHIPPED</option>
      <option value="DELIVERED">DELIVERED</option>
      <option value="CANCELLED">CANCELLED</option>
    </select>
  );
}
