"use client";

import { useParams } from "next/navigation";
import ParcelBookingForm from "@/components/booking/ParcelBookingForm";

export default function EditParcelBookingPage() {
  const params = useParams();
  const bookingId = params?.id as string;

  return <ParcelBookingForm bookingId={bookingId} isEdit={true} />;
}
