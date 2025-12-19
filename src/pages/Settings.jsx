import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Bell,
  Shield,
  Moon,
  LogOut,
  Save,
  Loader2,
} from "lucide-react";

export default function Settings() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    timezone: "",
  });
  const [notifications, setNotifications] = useState({
    dailyReminder: true,
    weeklyDigest: true,
    newModules: true,
  });

  useEffect(() => {
    const loadUser = async () => {
      const userData = await base44.auth.me();
      setUser(userData);
      setFormData({
        full_name: userData.full_name || "",
        timezone: userData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      setIsLoading(false);
    };
    loadUser();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    await base44.auth.updateMe(formData);
    setIsSaving(false);
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#6B1B3D] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-50 to-white p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-10"
        >
          <h1 className="text-3xl font-bold text-[#4A1228] mb-2">Settings</h1>
          <p className="text-gray-600">
            Manage your account preferences.
          </p>
        </motion.div>

        <div className="space-y-6">
          {/* Profile */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5 text-[#6B1B3D]" />
                  Profile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 bg-gradient-to-br from-[#6B1B3D] to-[#8B2E4D] rounded-full flex items-center justify-center">
                    <span className="text-3xl font-bold text-white">
                      {formData.full_name?.[0] || user?.email?.[0] || "U"}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-medium text-[#4A1228]">
                      {formData.full_name || "Add your name"}
                    </h3>
                    <p className="text-gray-500 text-sm">{user?.email}</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={formData.full_name}
                      onChange={(e) =>
                        setFormData({ ...formData, full_name: e.target.value })
                      }
                      placeholder="Your name"
                      className="rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      value={user?.email || ""}
                      disabled
                      className="rounded-xl bg-gray-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Input
                      id="timezone"
                      value={formData.timezone}
                      onChange={(e) =>
                        setFormData({ ...formData, timezone: e.target.value })
                      }
                      className="rounded-xl"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full bg-gradient-to-r from-[#6B1B3D] to-[#8B2E4D] text-white"
                >
                  {isSaving ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-5 h-5 mr-2" />
                  )}
                  Save Changes
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Notifications */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-[#6B1B3D]" />
                  Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[#4A1228]">Daily Reminder</p>
                    <p className="text-sm text-gray-500">
                      Get reminded to do your daily check-in
                    </p>
                  </div>
                  <Switch
                    checked={notifications.dailyReminder}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, dailyReminder: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[#4A1228]">Weekly Digest</p>
                    <p className="text-sm text-gray-500">
                      Receive a summary of your weekly progress
                    </p>
                  </div>
                  <Switch
                    checked={notifications.weeklyDigest}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, weeklyDigest: checked })
                    }
                  />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-[#4A1228]">New Module Alerts</p>
                    <p className="text-sm text-gray-500">
                      Be notified when new modules unlock
                    </p>
                  </div>
                  <Switch
                    checked={notifications.newModules}
                    onCheckedChange={(checked) =>
                      setNotifications({ ...notifications, newModules: checked })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Account */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-[#6B1B3D]" />
                  Account
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Button
                  onClick={handleLogout}
                  variant="outline"
                  className="w-full border-red-200 text-red-600 hover:bg-red-50"
                >
                  <LogOut className="w-5 h-5 mr-2" />
                  Sign Out
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}