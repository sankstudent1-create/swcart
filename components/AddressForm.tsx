"use client";

import { useTransition, useState } from "react";
import { addAddressAction } from "@/app/actions/profile";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function AddressForm() {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await addAddressAction(formData);
      if (res.success) {
        toast.success("Address added successfully!");
        setIsOpen(false);
      } else {
        toast.error(res.message);
      }
    });
  };

  if (!isOpen) {
    return (
      <div className="border border-2 rounded-4 p-5 border-dashed text-center bg-light bg-opacity-50" style={{borderStyle: "dashed"}}>
        <i className="bi bi-geo-alt text-muted mb-3 d-block" style={{fontSize: "2.5rem"}}></i>
        <h5 className="fw-bold">No Addresses Saved</h5>
        <p className="text-muted small mb-4">Save your shipping addresses for a faster checkout experience.</p>
        <button onClick={() => setIsOpen(true)} className="btn btn-outline-dark rounded-pill px-4 fw-semibold border-2">Add New Address</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleAdd} className="bg-white border rounded-4 p-4 shadow-sm mt-4">
      <h5 className="fw-bold mb-4">Add New Address</h5>
      <div className="row g-3">
        <div className="col-12 form-group">
          <label className="text-muted small mb-1 fw-semibold">Street Address</label>
          <input type="text" name="street" className="form-control" placeholder="123 Shopping Avenue" required />
        </div>
        <div className="col-md-6 form-group">
          <label className="text-muted small mb-1 fw-semibold">City</label>
          <input type="text" name="city" className="form-control" placeholder="Mumbai" required />
        </div>
        <div className="col-md-6 form-group">
          <label className="text-muted small mb-1 fw-semibold">State</label>
          <input type="text" name="state" className="form-control" placeholder="Maharashtra" required />
        </div>
        <div className="col-md-6 form-group">
          <label className="text-muted small mb-1 fw-semibold">Postal Code</label>
          <input type="text" name="postalCode" className="form-control" placeholder="400001" required />
        </div>
        <div className="col-md-6 form-group">
          <label className="text-muted small mb-1 fw-semibold">Country</label>
          <input type="text" name="country" className="form-control" defaultValue="India" required />
        </div>
        <div className="col-12 mt-4 d-flex gap-2">
          <button type="submit" className="btn btn-dark rounded-pill px-4" disabled={isPending}>
            {isPending ? "Saving..." : "Save Address"}
          </button>
          <button type="button" onClick={() => setIsOpen(false)} className="btn btn-light rounded-pill px-4" disabled={isPending}>
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
