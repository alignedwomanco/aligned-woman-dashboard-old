import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Plus, Trash2, Check, AlertCircle } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function StripeIntegrationContent({ currentUser }) {
  const [showAddKey, setShowAddKey] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const queryClient = useQueryClient();

  const { data: users = [] } = useQuery({
    queryKey: ["usersWithStripe"],
    queryFn: () => base44.entities.User.list(),
  });

  const expertsAndEducators = users.filter(u => 
    ["expert", "educator"].includes(u.role) || u.is_expert || u.is_educator
  );

  const saveStripeMutation = useMutation({
    mutationFn: async (key) => {
      await base44.auth.updateMe({
        stripe_api_key: key,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
      setShowAddKey(false);
      setApiKey("");
    },
  });

  const removeStripeMutation = useMutation({
    mutationFn: async () => {
      await base44.auth.updateMe({
        stripe_api_key: null,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });

  const isExpertOrEducator = ["expert", "educator"].includes(currentUser?.role) || 
    currentUser?.is_expert || currentUser?.is_educator;

  return (
    <div className="space-y-6">
      {/* Platform Stripe Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Platform Stripe Integration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Configure your platform-wide Stripe account to handle payments for courses and memberships.
            </AlertDescription>
          </Alert>

          <div>
            <Label>Platform Stripe API Key</Label>
            <div className="flex gap-2">
              <Input
                type="password"
                placeholder="sk_live_..."
                defaultValue={currentUser?.stripe_api_key ? "••••••••••••••••" : ""}
              />
              <Button variant="outline">
                Configure
              </Button>
            </div>
          </div>

          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
            <p className="text-sm text-gray-700">
              <strong>Note:</strong> Experts and Educators can connect their own Stripe accounts below to receive direct payments.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Personal Stripe Integration for Experts/Educators */}
      {isExpertOrEducator && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Your Personal Stripe Account
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Connect your own Stripe account to receive payments directly from your courses and services.
              </AlertDescription>
            </Alert>

            {currentUser?.stripe_api_key ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium text-green-900">Stripe Connected</p>
                      <p className="text-sm text-green-700">Your account is ready to receive payments</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => removeStripeMutation.mutate()}
                    className="text-red-600"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Disconnect
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {!showAddKey ? (
                  <Button
                    onClick={() => setShowAddKey(true)}
                    className="w-full bg-[#6E1D40] hover:bg-[#5A1633]"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Connect Stripe Account
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <Label>Stripe API Key</Label>
                      <Input
                        type="password"
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        placeholder="sk_live_..."
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Get your API key from your Stripe dashboard
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => saveStripeMutation.mutate(apiKey)}
                        disabled={!apiKey}
                        className="flex-1 bg-[#6E1D40]"
                      >
                        Save API Key
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setShowAddKey(false);
                          setApiKey("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* List of Connected Experts/Educators (Admin view) */}
      {["owner", "admin", "master_admin"].includes(currentUser?.role) && (
        <Card>
          <CardHeader>
            <CardTitle>Connected Experts & Educators</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {expertsAndEducators.map(user => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{user.full_name || user.email}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                  <Badge className={user.stripe_api_key ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                    {user.stripe_api_key ? "Connected" : "Not Connected"}
                  </Badge>
                </div>
              ))}
              {expertsAndEducators.length === 0 && (
                <p className="text-center text-gray-500 py-8">No experts or educators yet</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}