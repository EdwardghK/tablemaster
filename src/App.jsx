// src/App.jsx
import { Routes, Route } from "react-router-dom";

import Layout from "@/components/Layout.jsx";

import TablesPage from "@/Pages/Tables.jsx";
import ExpoPage from "@/Pages/Expo.jsx";
import ExpoTableDetails from "@/Pages/ExpoTableDetails.jsx";
import TableDetails from "@/Pages/TableDetails.jsx";
import MenuPage from "@/Pages/Menu.jsx";
import MenuBuilder from "@/Pages/MenuBuilder.jsx";
import FloorMap from "@/Pages/FloorMap.jsx";
import Home from "@/Pages/Home.jsx";

export default function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<TablesPage />} />
        <Route path="/expo" element={<ExpoPage />} />
        <Route path="/expo/table" element={<ExpoTableDetails />} />
        <Route path="/menu" element={<MenuPage />} />
        <Route path="/menu-builder" element={<MenuBuilder />} />
        <Route path="/TableDetails" element={<TableDetails />} />
        <Route path="/tabledetails" element={<TableDetails />} />
        <Route path="/floormap" element={<FloorMap />} />
        <Route path="/home" element={<Home />} />
      </Routes>
    </Layout>
  );
}
