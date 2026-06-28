"use client";

import { useTransition, useState } from "react";
import { addAddressAction } from "@/app/actions/profile";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export default function AddressForm() {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [addressDetails, setAddressDetails] = useState({
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India"
  });
  const router = useRouter();

  const handleAdd = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const res = await addAddressAction(formData);
      if (res.success) {
        toast.success("Address added successfully!");
        setIsOpen(false);
        setAddressDetails({
          street: "",
          city: "",
          state: "",
          postalCode: "",
          country: "India"
        });
      } else {
        toast.error(res.message);
      }
    });
  };

  const handleAutofillLocation = () => {
    if (!navigator.geolocation) {
      return toast.error("Geolocation is not supported by your browser");
    }
    setIsLocating(true);
    toast.loading("Locating your position...", { id: "locate" });
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`);
          const data = await res.json();
          if (data && data.address) {
            const addr = data.address;
            const street = addr.road || addr.suburb || addr.neighbourhood || addr.amenity || "";
            const city = addr.city || addr.town || addr.village || addr.state_district || "";
            const state = addr.state || "";
            const zip = addr.postcode || "";
            
            setAddressDetails({
              street,
              city,
              state,
              postalCode: zip,
              country: addr.country || "India"
            });
            toast.success("Location autofilled successfully!", { id: "locate" });
          } else {
            toast.error("Could not resolve address details", { id: "locate" });
          }
        } catch (e) {
          toast.error("Failed to fetch address from location", { id: "locate" });
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        toast.error("Location access denied or timed out", { id: "locate" });
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
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
    <form onSubmit={handleAdd} className="bg-white border rounded-4 p-4 shadow-sm mt-4 font-jakarta">
      <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
        <h5 className="fw-bold m-0 text-dark">Add New Address</h5>
        <button 
          type="button" 
          className="btn btn-sm btn-outline-danger rounded-pill fw-bold animate-pulse"
          onClick={handleAutofillLocation}
          disabled={isLocating}
        >
          {isLocating ? (
            <><span className="spinner-border spinner-border-sm me-1"></span> Locating...</>
          ) : (
            <><i className="bi bi-geo-alt-fill me-1"></i> Use Current Location</>
          )}
        </button>
      </div>
      <div className="row g-3">
        <div className="col-12 form-group">
          <label className="text-muted small mb-1 fw-semibold">Street Address</label>
          <input 
            type="text" 
            name="street" 
            className="form-control" 
            placeholder="123 Shopping Avenue" 
            value={addressDetails.street} 
            onChange={(e) => setAddressDetails({ ...addressDetails, street: e.target.value })} 
            required 
          />
        </div>
        <div className="col-md-6 form-group">
          <label className="text-muted small mb-1 fw-semibold">City</label>
          <input 
            type="text" 
            name="city" 
            className="form-control" 
            placeholder="Mumbai" 
            value={addressDetails.city} 
            onChange={(e) => setAddressDetails({ ...addressDetails, city: e.target.value })} 
            required 
          />
        </div>
        <div className="col-md-6 form-group">
          <label className="text-muted small mb-1 fw-semibold">State</label>
          <input 
            type="text" 
            name="state" 
            className="form-control" 
            placeholder="Maharashtra" 
            value={addressDetails.state} 
            onChange={(e) => setAddressDetails({ ...addressDetails, state: e.target.value })} 
            required 
          />
        </div>
        <div className="col-md-6 form-group">
          <label className="text-muted small mb-1 fw-semibold">Postal Code</label>
          <input 
            type="text" 
            name="postalCode" 
            className="form-control" 
            placeholder="400001" 
            value={addressDetails.postalCode} 
            onChange={(e) => setAddressDetails({ ...addressDetails, postalCode: e.target.value })} 
            required 
          />
        </div>
        <div className="col-md-6 form-group">
          <label className="text-muted small mb-1 fw-semibold">Country</label>
          <input 
            type="text" 
            name="country" 
            className="form-control" 
            value={addressDetails.country} 
            onChange={(e) => setAddressDetails({ ...addressDetails, country: e.target.value })} 
            required 
          />
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
