import React from "react";
import Layout from "./layouts/Layout";
import { BrowserRouter, Router, Routes } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}

export default App;
