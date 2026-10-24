import React from "react";
import DataRequestClient from "./DataRequestClient";

export const metadata = {
  title: "Data Subject Rights Request | Shadify DPDP Portal",
  description:
    "Submit a statutory data access, correction, or permanent erasure request under the Digital Personal Data Protection Act 2023.",
};

export default function DataRequestPage() {
  return <DataRequestClient />;
}
