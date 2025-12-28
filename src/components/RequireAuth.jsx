import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/supabase";

export default function RequireAuth({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [status, setStatus] = useState("checking"); // checking | authed | guest

  useEffect(() => {
    let active = true;
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (data?.session?.user) {
        setStatus("authed");
      } else {
        setStatus("guest");
        if (location.pathname !== "/login") {
          navigate("/login", { replace: true });
        }
      }
    };
    check();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      if (session?.user) {
        setStatus("authed");
        if (location.pathname === "/login") {
          navigate("/", { replace: true });
        }
      } else {
        setStatus("guest");
        if (location.pathname !== "/login") {
          navigate("/login", { replace: true });
        }
      }
    });
    return () => {
      active = false;
      listener?.subscription?.unsubscribe();
    };
  }, [location.pathname, navigate]);

  if (status === "checking") {
    return null;
  }

  if (status === "guest" && location.pathname !== "/login") {
    return null;
  }

  return children;
}
