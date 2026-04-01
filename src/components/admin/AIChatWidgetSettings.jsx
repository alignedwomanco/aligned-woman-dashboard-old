import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Upload, Save, AlertCircle, MessageCircle, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function AIChatWidgetSettings() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState({
    chatbot_name: "LaurAI",
    chatbot_profile_picture: "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/6945438e6f6e0e1d874ba569/32aa3b031_image.png",
    greeting_message: "Hi there! I'm LaurAI, your personal guide to The Aligned Woman Blueprint. How can I help you today?",
    knowledge_base: "",
    temperature: 0.7,
    max_tokens: 500,
    is_enabled: true,
    theme_color: "#6E1D40",
    allowed_pages: [],
  });

  const { data: existingSettings = [] } = useQuery({
    queryKey: ["chatWidgetSettings"],
    queryFn: () => base44.entities.ChatWidgetSettings.list(),
    onSuccess: (data) => {
      if (data.length > 0) {
        setSettings(data[0]);
      }
    },
  });

  const { data: chatLogs = [] } = useQuery({
    queryKey: ["chatWidgetLogs"],
    queryFn: () => base44.entities.ChatWidgetLog.list("-created_date", 50),
  });

  useEffect(() => {
    if (existingSettings.length > 0) {
      setSettings(existingSettings[0]);
    }
  }, [existingSettings]);

  const saveSettingsMutation = useMutation({
    mutationFn: async (data) => {
      if (existingSettings.length > 0) {
        return base44.entities.ChatWidgetSettings.update(existingSettings[0].id, data);
      } else {
        return base44.entities.ChatWidgetSettings.create(data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatWidgetSettings"] });
    },
  });

  const deleteLogMutation = useMutation({
    mutationFn: (logId) => base44.entities.ChatWidgetLog.delete(logId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatWidgetLogs"] });
    },
  });

  const clearAllLogsMutation = useMutation({
    mutationFn: async () => {
      await Promise.all(chatLogs.map(log => base44.entities.ChatWidgetLog.delete(log.id)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["chatWidgetLogs"] });
    },
  });

  const handleSave = () => {
    saveSettingsMutation.mutate(settings);
  };

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setSettings({ ...settings, chatbot_profile_picture: file_url });
  };

  const errorLogs = chatLogs.filter(log => log.error_message);
  const avgResponseTime = chatLogs.length > 0 
    ? Math.round(chatLogs.reduce((sum, log) => sum + (log.response_time_ms || 0), 0) / chatLogs.length)
    : 0;

  return (
    <div className="space-y-6">
      <Tabs defaultValue="general" className="w-full">
        <TabsList>
          <TabsTrigger value="general">General Settings</TabsTrigger>
          <TabsTrigger value="knowledge">Knowledge Base</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
          <TabsTrigger value="logs">
            Activity Logs
            {errorLogs.length > 0 && (
              <Badge variant="destructive" className="ml-2">{errorLogs.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Chatbot Identity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profile Picture */}
              <div className="flex items-center gap-6">
                <Avatar className="w-20 h-20 border-4 border-white shadow-lg">
                  <AvatarImage src={settings.chatbot_profile_picture} />
                  <AvatarFallback className="bg-[#6E1D40] text-white text-2xl">
                    {settings.chatbot_name?.[0] || "AI"}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Label htmlFor="avatar-upload" className="cursor-pointer">
                    <div className="flex items-center gap-2 px-4 py-2 bg-pink-50 hover:bg-pink-100 rounded-lg transition-colors">
                      <Upload className="w-4 h-4 text-[#6E1D40]" />
                      <span className="text-sm font-medium text-[#6E1D40]">
                        Change Avatar
                      </span>
                    </div>
                    <Input
                      id="avatar-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleProfilePictureUpload}
                    />
                  </Label>
                  <p className="text-xs text-gray-500 mt-1">JPG, PNG, max 5MB</p>
                </div>
              </div>

              {/* Chatbot Name */}
              <div>
                <Label>Chatbot Name *</Label>
                <Input
                  value={settings.chatbot_name}
                  onChange={(e) => setSettings({ ...settings, chatbot_name: e.target.value })}
                  placeholder="LaurAI"
                />
              </div>

              {/* Greeting Message */}
              <div>
                <Label>Greeting Message *</Label>
                <Textarea
                  value={settings.greeting_message}
                  onChange={(e) => setSettings({ ...settings, greeting_message: e.target.value })}
                  placeholder="Hi there! How can I help you?"
                  className="min-h-[80px]"
                />
              </div>

              {/* Theme Color */}
              <div>
                <Label>Theme Color</Label>
                <div className="flex gap-3">
                  <Input
                    type="color"
                    value={settings.theme_color}
                    onChange={(e) => setSettings({ ...settings, theme_color: e.target.value })}
                    className="w-20 h-10"
                  />
                  <Input
                    value={settings.theme_color}
                    onChange={(e) => setSettings({ ...settings, theme_color: e.target.value })}
                    placeholder="#6E1D40"
                  />
                </div>
              </div>

              {/* Enable/Disable */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-base">Enable Chatbot</Label>
                  <p className="text-sm text-gray-600">Show the chat widget to users</p>
                </div>
                <Switch
                  checked={settings.is_enabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, is_enabled: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Knowledge Base */}
        <TabsContent value="knowledge">
          <Card>
            <CardHeader>
              <CardTitle>Knowledge Base</CardTitle>
              <p className="text-sm text-gray-600">
                Provide custom knowledge and context for the chatbot. This will be included in every conversation.
              </p>
            </CardHeader>
            <CardContent>
              <Textarea
                value={settings.knowledge_base}
                onChange={(e) => setSettings({ ...settings, knowledge_base: e.target.value })}
                placeholder="Enter custom knowledge, FAQs, specific instructions, course details, etc..."
                className="min-h-[400px] font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-2">
                Tip: Include information about your platform, courses, tools, and common questions users might ask.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Settings */}
        <TabsContent value="advanced" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI Parameters</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Temperature */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Temperature</Label>
                  <span className="text-sm text-gray-600">{settings.temperature}</span>
                </div>
                <Slider
                  value={[settings.temperature]}
                  onValueChange={(val) => setSettings({ ...settings, temperature: val[0] })}
                  max={1}
                  min={0}
                  step={0.1}
                  className="py-4"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Lower = more focused and deterministic. Higher = more creative and varied.
                </p>
              </div>

              {/* Max Tokens */}
              <div>
                <Label>Max Response Length (tokens)</Label>
                <Input
                  type="number"
                  value={settings.max_tokens}
                  onChange={(e) => setSettings({ ...settings, max_tokens: parseInt(e.target.value) })}
                  min={50}
                  max={2000}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Maximum length of chatbot responses (100-2000 tokens)
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Page Visibility</CardTitle>
              <p className="text-sm text-gray-600">
                Control which pages show the chatbot (leave empty for all pages)
              </p>
            </CardHeader>
            <CardContent>
              <Textarea
                value={settings.allowed_pages?.join('\n') || ""}
                onChange={(e) => setSettings({ 
                  ...settings, 
                  allowed_pages: e.target.value.split('\n').filter(p => p.trim()) 
                })}
                placeholder="Dashboard&#10;Classroom&#10;Community&#10;(one per line)"
                className="min-h-[150px] font-mono text-sm"
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activity Logs */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Activity & Error Logs</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Monitor chatbot conversations and errors
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => clearAllLogsMutation.mutate()}
                  disabled={chatLogs.length === 0}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Clear All Logs
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-2xl font-bold text-blue-700">{chatLogs.length}</div>
                  <div className="text-sm text-blue-600">Total Conversations</div>
                </div>
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="text-2xl font-bold text-red-700">{errorLogs.length}</div>
                  <div className="text-sm text-red-600">Errors</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-2xl font-bold text-green-700">{avgResponseTime}ms</div>
                  <div className="text-sm text-green-600">Avg Response Time</div>
                </div>
              </div>

              {/* Logs Table */}
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Message</TableHead>
                      <TableHead>Response</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chatLogs.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          No activity logs yet
                        </TableCell>
                      </TableRow>
                    ) : (
                      chatLogs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell className="text-xs">
                            {new Date(log.created_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-xs">{log.created_by}</TableCell>
                          <TableCell className="max-w-xs truncate text-sm">
                            {log.user_message}
                          </TableCell>
                          <TableCell className="max-w-xs truncate text-sm">
                            {log.bot_response || log.error_message}
                          </TableCell>
                          <TableCell className="text-xs">
                            {log.response_time_ms ? `${log.response_time_ms}ms` : "-"}
                          </TableCell>
                          <TableCell>
                            {log.error_message ? (
                              <Badge variant="destructive" className="flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Error
                              </Badge>
                            ) : (
                              <Badge className="bg-green-100 text-green-800">Success</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteLogMutation.mutate(log.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          className="bg-[#6E1D40] hover:bg-[#5A1633]"
          disabled={saveSettingsMutation.isLoading}
        >
          <Save className="w-4 h-4 mr-2" />
          {saveSettingsMutation.isLoading ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </div>
  );
}