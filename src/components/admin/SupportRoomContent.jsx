import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  Ticket, 
  Trash2, 
  Eye, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Send,
  FileText,
  User,
  Calendar
} from "lucide-react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import moment from "moment";

export default function SupportRoomContent({ currentUser }) {
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [response, setResponse] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const queryClient = useQueryClient();

  const { data: tickets = [] } = useQuery({
    queryKey: ["supportTickets", filterStatus],
    queryFn: async () => {
      if (filterStatus === "all") {
        return base44.entities.SupportTicket.list("-created_date");
      }
      return base44.entities.SupportTicket.filter({ status: filterStatus }, "-created_date");
    },
  });

  const { data: users = [] } = useQuery({
    queryKey: ["allUsers"],
    queryFn: () => base44.entities.User.list(),
  });

  const updateTicketMutation = useMutation({
    mutationFn: ({ ticketId, data }) => base44.entities.SupportTicket.update(ticketId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supportTickets"] });
    },
  });

  const deleteTicketMutation = useMutation({
    mutationFn: (ticketId) => base44.entities.SupportTicket.delete(ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["supportTickets"] });
      setSelectedTicket(null);
    },
  });

  const respondToTicket = async () => {
    if (!response.trim() || !selectedTicket) return;

    await updateTicketMutation.mutateAsync({
      ticketId: selectedTicket.id,
      data: {
        adminResponse: response,
        respondedAt: new Date().toISOString(),
        status: "in_progress",
      },
    });

    // Send email notification
    await base44.integrations.Core.SendEmail({
      to: selectedTicket.created_by,
      subject: `Re: ${selectedTicket.subject}`,
      body: `Your support ticket has been updated.\n\nAdmin Response:\n${response}\n\nTicket ID: ${selectedTicket.id}`,
    });

    setResponse("");
  };

  const addInternalNote = async () => {
    if (!internalNote.trim() || !selectedTicket) return;

    const notes = selectedTicket.internalNotes || [];
    notes.push({
      note: internalNote,
      addedBy: currentUser.email,
      addedAt: new Date().toISOString(),
    });

    await updateTicketMutation.mutateAsync({
      ticketId: selectedTicket.id,
      data: { internalNotes: notes },
    });

    setInternalNote("");
  };

  const getUserByEmail = (email) => {
    return users.find(u => u.email === email);
  };

  const getStatusBadge = (status) => {
    const colors = {
      open: "bg-red-100 text-red-800",
      in_progress: "bg-yellow-100 text-yellow-800",
      resolved: "bg-green-100 text-green-800",
      closed: "bg-gray-100 text-gray-800",
    };
    return colors[status] || colors.open;
  };

  const getPriorityBadge = (priority) => {
    const colors = {
      urgent: "bg-red-100 text-red-800 border-red-300",
      high: "bg-orange-100 text-orange-800 border-orange-300",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-300",
      low: "bg-blue-100 text-blue-800 border-blue-300",
    };
    return colors[priority] || colors.medium;
  };

  const stats = {
    total: tickets.length,
    open: tickets.filter(t => t.status === "open").length,
    in_progress: tickets.filter(t => t.status === "in_progress").length,
    resolved: tickets.filter(t => t.status === "resolved").length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Tickets</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Ticket className="w-8 h-8 text-[#6B1B3D]" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Open</p>
                <p className="text-2xl font-bold text-red-600">{stats.open}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.in_progress}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Resolved</p>
                <p className="text-2xl font-bold text-green-600">{stats.resolved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5" />
              Support Tickets
            </CardTitle>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tickets</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ticket</TableHead>
                <TableHead>User</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.map((ticket) => {
                const user = getUserByEmail(ticket.created_by);
                return (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{ticket.subject}</p>
                        <p className="text-xs text-gray-500 line-clamp-1">{ticket.message}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{user?.full_name || "Unknown"}</p>
                        <p className="text-xs text-gray-500">{ticket.created_by}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{ticket.category || "other"}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityBadge(ticket.priority)}>
                        {ticket.priority || "medium"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusBadge(ticket.status)}>
                        {ticket.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <p>{moment(ticket.created_date).format("MMM D, YYYY")}</p>
                        <p className="text-xs text-gray-500">{moment(ticket.created_date).fromNow()}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedTicket(ticket)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteTicketMutation.mutate(ticket.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {tickets.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              <Ticket className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No support tickets found</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <Ticket className="w-5 h-5" />
              {selectedTicket?.subject}
            </DialogTitle>
          </DialogHeader>

          {selectedTicket && (
            <div className="space-y-6">
              {/* Ticket Info */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-xs text-gray-600">User</Label>
                  <p className="font-medium">{getUserByEmail(selectedTicket.created_by)?.full_name || "Unknown"}</p>
                  <p className="text-sm text-gray-600">{selectedTicket.created_by}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Created</Label>
                  <p className="font-medium">{moment(selectedTicket.created_date).format("MMM D, YYYY h:mm A")}</p>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Category</Label>
                  <Badge variant="outline">{selectedTicket.category || "other"}</Badge>
                </div>
                <div>
                  <Label className="text-xs text-gray-600">Priority</Label>
                  <Badge className={getPriorityBadge(selectedTicket.priority)}>
                    {selectedTicket.priority || "medium"}
                  </Badge>
                </div>
              </div>

              {/* Original Message */}
              <div>
                <Label className="mb-2 block">Original Message</Label>
                <div className="p-4 bg-white border rounded-lg">
                  <p className="whitespace-pre-wrap">{selectedTicket.message}</p>
                </div>
              </div>

              {/* Admin Response */}
              {selectedTicket.adminResponse && (
                <div>
                  <Label className="mb-2 block">Admin Response</Label>
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="whitespace-pre-wrap">{selectedTicket.adminResponse}</p>
                    {selectedTicket.respondedAt && (
                      <p className="text-xs text-gray-600 mt-2">
                        Responded {moment(selectedTicket.respondedAt).fromNow()}
                      </p>
                    )}
                  </div>
                </div>
              )}

              <Tabs defaultValue="respond">
                <TabsList>
                  <TabsTrigger value="respond">Respond</TabsTrigger>
                  <TabsTrigger value="notes">Internal Notes ({selectedTicket.internalNotes?.length || 0})</TabsTrigger>
                  <TabsTrigger value="actions">Actions</TabsTrigger>
                </TabsList>

                <TabsContent value="respond" className="space-y-3">
                  <div>
                    <Label>Response to User</Label>
                    <Textarea
                      value={response}
                      onChange={(e) => setResponse(e.target.value)}
                      placeholder="Type your response..."
                      className="min-h-[150px]"
                    />
                  </div>
                  <Button
                    onClick={respondToTicket}
                    disabled={!response.trim()}
                    className="w-full bg-[#6B1B3D]"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send Response
                  </Button>
                </TabsContent>

                <TabsContent value="notes" className="space-y-3">
                  {selectedTicket.internalNotes?.map((note, idx) => (
                    <div key={idx} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-sm font-medium">{note.addedBy}</p>
                        <p className="text-xs text-gray-600">{moment(note.addedAt).fromNow()}</p>
                      </div>
                      <p className="text-sm">{note.note}</p>
                    </div>
                  ))}
                  <div>
                    <Label>Add Internal Note</Label>
                    <Textarea
                      value={internalNote}
                      onChange={(e) => setInternalNote(e.target.value)}
                      placeholder="Add a note (only visible to admins)..."
                      className="min-h-[100px]"
                    />
                  </div>
                  <Button
                    onClick={addInternalNote}
                    disabled={!internalNote.trim()}
                    variant="outline"
                    className="w-full"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Add Note
                  </Button>
                </TabsContent>

                <TabsContent value="actions" className="space-y-3">
                  <div>
                    <Label>Change Status</Label>
                    <Select
                      value={selectedTicket.status}
                      onValueChange={(status) =>
                        updateTicketMutation.mutate({
                          ticketId: selectedTicket.id,
                          data: { status },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Change Priority</Label>
                    <Select
                      value={selectedTicket.priority}
                      onValueChange={(priority) =>
                        updateTicketMutation.mutate({
                          ticketId: selectedTicket.id,
                          data: { priority },
                        })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    variant="destructive"
                    onClick={() => deleteTicketMutation.mutate(selectedTicket.id)}
                    className="w-full"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Ticket
                  </Button>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}