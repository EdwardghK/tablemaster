import React, { useEffect, useState } from "react";
import { supabase } from "@/supabase";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import Header from "@/components/common/Header";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [editing, setEditing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let active = true;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (!active) return;
      const user = data?.user;
      if (user) {
        setEmail(user.email || "");
        setName(user.user_metadata?.full_name || "");
        setPhone(user.user_metadata?.phone || "");
      }
      setLoading(false);
    })();
    return () => {
      active = false;
    };
  }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.updateUser({
        data: {
          full_name: name.trim() || null,
          phone: phone.trim() || null,
        },
      });
      if (error) throw error;
      const user = data?.user;
      if (user) {
        await supabase.from("profiles").upsert(
          {
            user_id: user.id,
            full_name: name.trim() || null,
            phone: phone.trim() || null,
            email: user.email || null,
          },
          { onConflict: "user_id" }
        );
      }
      toast.success("Profile updated");
    } catch (err) {
      console.error("Profile update error:", err);
      toast.error(err.message || "Could not update profile");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-900 pb-24">
      <Header title="Profile" />

      {!editing ? (
        <div className="p-4 space-y-3 max-w-xl mx-auto">
          <Button
            onClick={() => setEditing(true)}
            className="w-full bg-amber-700 hover:bg-amber-800 rounded-xl"
          >
            Edit Profile
          </Button>
          <Button
            variant="outline"
            onClick={handleLogout}
            className="w-full rounded-xl"
          >
            Logout
          </Button>
        </div>
      ) : (
        <div className="p-4 space-y-4 max-w-xl mx-auto">
          <div className="space-y-2">
            <label className="text-sm text-stone-700 dark:text-stone-200">Email</label>
            <Input value={email} disabled className="rounded-xl bg-stone-100 dark:bg-stone-800" />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-stone-700 dark:text-stone-200">Name</label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
              placeholder="Full name"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm text-stone-700 dark:text-stone-200">Phone</label>
            <Input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="rounded-xl bg-stone-50 dark:bg-stone-800 text-stone-900 dark:text-stone-100"
              placeholder="+1 555 123 4567"
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleSave}
              disabled={loading}
              className="flex-1 bg-amber-700 hover:bg-amber-800 rounded-xl"
            >
              {loading ? "Saving..." : "Save"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setEditing(false)}
              className="flex-1 rounded-xl"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
