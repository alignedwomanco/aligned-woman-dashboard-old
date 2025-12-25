import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { GripVertical, Save, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const DEFAULT_WIDGETS = [
  { id: "alive-profile", title: "Your ALIVE Profile", enabled: true, order: 0 },
  { id: "snapshot", title: "Daily Snapshot", enabled: true, order: 1 },
  { id: "purpose", title: "My Purpose", enabled: true, order: 2 },
  { id: "path", title: "Your ALIVE Path", enabled: true, order: 3 },
  { id: "recommended-modules", title: "Recommended Modules", enabled: true, order: 4 },
  { id: "cycle-intelligence", title: "Cycle & Body Intelligence", enabled: false, order: 5 },
  { id: "design-energetics", title: "Design & Energetics", enabled: false, order: 6 },
  { id: "tools", title: "Tools", enabled: true, order: 7 },
  { id: "identity-values", title: "Identity & Values", enabled: true, order: 8 },
  { id: "phase-integration", title: "Phase Integration", enabled: true, order: 9 },
  { id: "stats", title: "Your Stats", enabled: true, order: 10 },
];

export default function DashboardConfiguratorContent() {
  const [widgets, setWidgets] = useState(DEFAULT_WIDGETS);

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(widgets);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedItems = items.map((item, index) => ({
      ...item,
      order: index,
    }));

    setWidgets(updatedItems);
  };

  const toggleWidget = (id) => {
    setWidgets(widgets.map(w => 
      w.id === id ? { ...w, enabled: !w.enabled } : w
    ));
  };

  const saveConfiguration = () => {
    // Save to local storage or database
    localStorage.setItem("dashboardConfig", JSON.stringify(widgets));
    alert("Dashboard configuration saved!");
  };

  const resetToDefault = () => {
    setWidgets(DEFAULT_WIDGETS);
    localStorage.removeItem("dashboardConfig");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl mb-2">Dashboard Configurator</CardTitle>
              <p className="text-gray-600">
                Customize dashboard layout by dragging widgets to reorder them
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={resetToDefault}>
                Reset to Default
              </Button>
              <Button className="bg-[#6B1B3D] hover:bg-[#4A1228]" onClick={saveConfiguration}>
                <Save className="w-4 h-4 mr-2" />
                Save Configuration
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            {/* Left Column: Widget List */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Dashboard Widgets</h3>
              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="widgets">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="space-y-2"
                    >
                      {widgets.map((widget, index) => (
                        <Draggable
                          key={widget.id}
                          draggableId={widget.id}
                          index={index}
                        >
                          {(provided, snapshot) => (
                            <div
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              className={`flex items-center justify-between p-4 border-2 rounded-lg transition-all ${
                                snapshot.isDragging
                                  ? "border-[#6B1B3D] bg-pink-50 shadow-lg"
                                  : "border-gray-200 bg-white hover:border-gray-300"
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div
                                  {...provided.dragHandleProps}
                                  className="cursor-grab active:cursor-grabbing"
                                >
                                  <GripVertical className="w-5 h-5 text-gray-400" />
                                </div>
                                <div>
                                  <div className="font-medium">{widget.title}</div>
                                  <div className="text-sm text-gray-500">
                                    Position: {index + 1}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge
                                  className={
                                    widget.enabled
                                      ? "bg-green-100 text-green-800"
                                      : "bg-gray-100 text-gray-800"
                                  }
                                >
                                  {widget.enabled ? "Enabled" : "Disabled"}
                                </Badge>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => toggleWidget(widget.id)}
                                >
                                  {widget.enabled ? "Hide" : "Show"}
                                </Button>
                              </div>
                            </div>
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </div>

            {/* Right Column: Preview */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Dashboard Preview</h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50 min-h-[600px]">
                <div className="space-y-3">
                  {widgets
                    .filter((w) => w.enabled)
                    .map((widget) => (
                      <div
                        key={widget.id}
                        className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{widget.title}</span>
                          <Badge variant="outline" className="text-xs">
                            Order: {widget.order + 1}
                          </Badge>
                        </div>
                        <div className="mt-2 h-12 bg-gradient-to-r from-pink-100 to-purple-100 rounded animate-pulse" />
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Configuration Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-gray-600">
            <li className="flex items-start gap-2">
              <span className="text-[#6B1B3D] mt-1">•</span>
              <span>Drag widgets using the grip handle to reorder them</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#6B1B3D] mt-1">•</span>
              <span>Toggle widgets on/off to customize what users see</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#6B1B3D] mt-1">•</span>
              <span>Click "Save Configuration" to apply changes</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[#6B1B3D] mt-1">•</span>
              <span>Preview shows the order and enabled widgets in real-time</span>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}