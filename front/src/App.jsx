import React from "react";
import { BRAND } from "./branding/brand.js";

export default function App() {
  return (
    <div style={{ padding: 24 }}>
      <h1>{BRAND.name}</h1>
      <p>{BRAND.segment}</p>
    </div>
  );
}
