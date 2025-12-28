// src/App.jsx
import { Routes, Route, useLocation } from "react-router-dom";

import Layout from "@/components/Layout.jsx";
import RequireAuth from "@/components/RequireAuth.jsx";

import TablesPage from "@/Pages/Tables.jsx";
import ExpoPage from "@/Pages/Expo.jsx";
import ExpoTableDetails from "@/Pages/ExpoTableDetails.jsx";
import TableDetails from "@/Pages/TableDetails.jsx";
import MenuPage from "@/Pages/Menu.jsx";
import MenuBuilder from "@/Pages/MenuBuilder.jsx";
import FloorMap from "@/Pages/FloorMap.jsx";
import Home from "@/Pages/Home.jsx";
import Login from "@/Pages/Login.jsx";
import Profile from "@/Pages/Profile.jsx";

export default function App() {
  const { pathname } = useLocation();

  if (pathname === "/login") {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
      </Routes>
    );
  }

  return (
    <RequireAuth>
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
          <Route path="/profile" element={<Profile />} />
          <Route path="/home" element={<Home />} />
        </Routes>
      </Layout>
    </RequireAuth>
  );
}
