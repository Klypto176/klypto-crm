import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  MoreVertical,
  Calendar,
  MessageSquare,
  X,
  Send,
  Mail,
  Phone,
  Loader,
  TrendingUp,
  Target,
} from "lucide-react";
import apiClient from "../api/apiClient";
import { formatCurrency } from "../utils/currency";

const KanbanCard = ({
  lead,
  onClick,
  onStatusChange,
  stages,
  onDragStart,
  onDragEnd,
  isDragging,
  dragDisabled,
}) => (
  <motion.div
    layoutId={lead.id}
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    whileHover={{ scale: 1.02, y: -2 }}
    onClick={() => onClick(lead)}
    className="glass-card"
    style={{
      padding: "16px",
      marginBottom: "12px",
      cursor: dragDisabled ? "not-allowed" : "grab",
      background: "var(--card-hover)",
      border: "1px solid var(--border)",
      opacity: isDragging ? 0.6 : 1,
    }}
    draggable={!dragDisabled}
    onDragStart={(event) => onDragStart(event, lead.id)}
    onDragEnd={onDragEnd}
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        marginBottom: "8px",
      }}
    >
      <span
        style={{
          fontSize: "10px",
          fontWeight: "bold",
          textTransform: "uppercase",
          color:
            lead.priority === "High"
              ? "#ef4444"
              : lead.priority === "Low"
                ? "#10b981"
                : "#f59e0b",
        }}
      >
        {lead.priority}
      </span>
      <MoreVertical size={14} style={{ color: "var(--text-muted)" }} />
    </div>
    <div style={{ fontSize: "14px", fontWeight: "600", marginBottom: "4px" }}>
      {lead.name}
    </div>
    <div
      style={{
        fontSize: "12px",
        color: "var(--text-muted)",
        marginBottom: "12px",
      }}
    >
      {lead.company || "Individual"}
    </div>

    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: "12px",
        borderTop: "1px solid var(--border)",
        color: "var(--text-muted)",
        fontSize: "12px",
      }}
    >
      <div style={{ display: "flex", gap: "8px" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <MessageSquare size={12} /> {lead._count?.notes || 0}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <Target size={12} /> {formatCurrency(lead.value)}
        </span>
      </div>
      <div
        style={{
          width: "24px",
          height: "24px",
          borderRadius: "50%",
          backgroundColor: "var(--primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "10px",
          color: "var(--text-main)",
          fontWeight: "700",
        }}
      >
        {lead.name[0]}
      </div>
    </div>

    <div style={{ marginTop: "10px" }}>
      <select
        value={lead.status}
        disabled={dragDisabled}
        onClick={(event) => event.stopPropagation()}
        onChange={(event) => {
          event.stopPropagation();
          onStatusChange(lead.id, event.target.value);
        }}
        style={{
          width: "100%",
          backgroundColor: "var(--input-bg)",
          border: "1px solid var(--border)",
          borderRadius: "8px",
          color: "var(--text-main)",
          fontSize: "12px",
          fontWeight: "600",
          padding: "8px 10px",
          cursor: dragDisabled ? "not-allowed" : "pointer",
        }}
      >
        {stages.map((stage) => (
          <option key={stage.id} value={stage.id}>
            {stage.title}
          </option>
        ))}
      </select>
    </div>
  </motion.div>
);

const LeadSidePanel = ({ leadId, onClose }) => {
  const [lead, setLead] = useState(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchLeadDetails = async () => {
    try {
      const response = await apiClient.get(`/leads/${leadId}`);
      setLead(response.data);
    } catch (err) {
      console.error("Failed to fetch lead details", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (leadId) fetchLeadDetails();
  }, [leadId]);

  const handleAddNote = async () => {
    if (!note.trim()) return;
    setSubmitting(true);
    try {
      await apiClient.post(`/leads/${leadId}/notes`, { content: note });
      setNote("");
      fetchLeadDetails();
    } catch (err) {
      console.error("Failed to add note", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !lead) {
    return (
      <div
        style={{
          position: "fixed",
          right: 0,
          top: 0,
          width: "450px",
          height: "100vh",
          backgroundColor: "var(--bg-sidebar)",
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Loader className="spinner" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      style={{
        position: "fixed",
        right: 0,
        top: 0,
        width: "100%",
        maxWidth: "450px",
        height: "100vh",
        backgroundColor: "var(--bg-sidebar)",
        borderLeft: "1px solid var(--border)",
        zIndex: 100,
        boxShadow: "-10px 0 30px rgba(0,0,0,0.3)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          padding: "24px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2 style={{ fontSize: "18px", fontWeight: "700" }}>Lead Profile</h2>
        <button onClick={onClose} style={{ color: "var(--text-main)" }}>
          <X size={20} style={{ color: "var(--text-main)" }} />
        </button>
      </div>

      <div style={{ padding: "24px", overflowY: "auto", flex: 1 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "24px",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              borderRadius: "16px",
              backgroundColor: "var(--primary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "24px",
              fontWeight: "bold",
              color: "var(--text-main)",
            }}
          >
            {lead.name[0]}
          </div>
          <div>
            <div style={{ fontSize: "20px", fontWeight: "700" }}>
              {lead.name}
            </div>
            <div style={{ color: "var(--text-muted)" }}>
              {lead.company || "Individual"}
            </div>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "12px",
            marginBottom: "24px",
          }}
        >
          <div className="glass-card" style={{ padding: "12px" }}>
            <div
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                marginBottom: "4px",
              }}
            >
              Email
            </div>
            <div
              style={{
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Mail size={12} /> {lead.email || "N/A"}
            </div>
          </div>
          <div className="glass-card" style={{ padding: "12px" }}>
            <div
              style={{
                fontSize: "11px",
                color: "var(--text-muted)",
                marginBottom: "4px",
              }}
            >
              Phone
            </div>
            <div
              style={{
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Phone size={12} /> {lead.phone || "N/A"}
            </div>
          </div>
        </div>

        <div style={{ marginBottom: "32px" }}>
          <h3
            style={{
              fontSize: "16px",
              fontWeight: "600",
              marginBottom: "16px",
            }}
          >
            Timeline & Notes
          </h3>
          <div style={{ position: "relative", marginBottom: "20px" }}>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add activity update..."
              style={{
                width: "100%",
                height: "80px",
                backgroundColor: "var(--input-bg)",
                border: "1px solid var(--border)",
                borderRadius: "12px",
                padding: "12px",
                color: "var(--text-main)",
                fontSize: "13px",
                outline: "none",
                resize: "none",
              }}
            />
            <button
              onClick={handleAddNote}
              disabled={submitting}
              style={{
                position: "absolute",
                right: "10px",
                bottom: "10px",
                backgroundColor: "var(--primary)",
                color: "var(--text-main)",
                padding: "4px 10px",
                borderRadius: "6px",
                fontSize: "11px",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                minWidth: "60px",
                justifyContent: "center",
              }}
            >
              {submitting ? (
                <Loader size={12} className="spinner" />
              ) : (
                <>
                  <Send size={12} /> Save
                </>
              )}
            </button>
          </div>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "12px" }}
          >
            {lead.notes?.map((n) => (
              <div
                key={n.id}
                style={{
                  padding: "12px",
                  backgroundColor: "var(--column-bg)",
                  borderRadius: "10px",
                  border: "1px solid var(--border)",
                }}
              >
                <div style={{ fontSize: "13px", marginBottom: "4px" }}>
                  {n.content}
                </div>
                <div style={{ fontSize: "10px", color: "var(--text-muted)" }}>
                  {new Date(n.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

const Leads = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);
  const [draggedLeadId, setDraggedLeadId] = useState(null);
  const [dragOverStage, setDragOverStage] = useState(null);
  const [selectedLeadId, setSelectedLeadId] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    phone: "",
    priority: "Medium",
    status: "New",
    value: "",
  });

  const stages = [
    { id: "New", title: "New Leads" },
    { id: "Discovery", title: "Discovery" },
    { id: "Proposal", title: "Proposal" },
    { id: "Negotiation", title: "Negotiation" },
    { id: "Won", title: "Closed Won" },
    { id: "Lost", title: "Closed Lost" },
  ];

  const fetchLeads = async () => {
    try {
      const response = await apiClient.get("/leads");
      setLeads(response.data);
    } catch (err) {
      console.error("Failed to fetch leads", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  const handleCreateLead = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post("/leads", {
        ...formData,
        value: Number(formData.value),
      });
      setShowAddModal(false);
      setFormData({
        name: "",
        company: "",
        email: "",
        phone: "",
        priority: "Medium",
        status: "New",
        value: 0,
      });
      fetchLeads();
    } catch (err) {
      console.error("Failed to create lead", err);
      alert("Failed to create lead");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (leadId, newStatus) => {
    setActionLoading(leadId);
    try {
      await apiClient.patch(`/leads/${leadId}`, { status: newStatus });
      fetchLeads();
    } catch (err) {
      console.error("Failed to update status", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleLeadDragStart = (event, leadId) => {
    setDraggedLeadId(leadId);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", leadId);
  };

  const handleLeadDragEnd = () => {
    setDraggedLeadId(null);
    setDragOverStage(null);
  };

  const handleStageDragOver = (event, stageId) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (dragOverStage !== stageId) {
      setDragOverStage(stageId);
    }
  };

  const handleStageDrop = async (event, stageId) => {
    event.preventDefault();
    const droppedLeadId =
      draggedLeadId || event.dataTransfer.getData("text/plain");
    if (!droppedLeadId) return;

    const targetLead = leads.find((lead) => lead.id === droppedLeadId);
    if (!targetLead || targetLead.status === stageId) {
      setDraggedLeadId(null);
      setDragOverStage(null);
      return;
    }

    const previousLeads = leads;
    const nextLeads = leads.map((lead) =>
      lead.id === droppedLeadId ? { ...lead, status: stageId } : lead,
    );

    setLeads(nextLeads);
    setActionLoading(droppedLeadId);

    try {
      await apiClient.patch(`/leads/${droppedLeadId}`, { status: stageId });
    } catch (err) {
      setLeads(previousLeads);
      console.error("Failed to update lead status", err);
      alert("Failed to update lead status");
    } finally {
      setActionLoading(null);
      setDraggedLeadId(null);
      setDragOverStage(null);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          height: "400px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Loader className="spinner" />
      </div>
    );
  }

  return (
    <div
      style={{
        height: "calc(100vh - 120px)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <header
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: "16px",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
        }}
      >
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: "700" }}>Pipeline</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>
            Live sales funnel track
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={() => setShowAddModal(true)}
            className="btn-primary"
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <Plus size={18} /> Add Lead
          </button>
        </div>
      </header>

      <div
        style={{
          display: "flex",
          gap: "20px",
          flex: 1,
          overflowX: "auto",
          paddingBottom: "20px",
        }}
      >
        {stages.map((stage) => {
          const stageLeads = leads.filter((l) => l.status === stage.id);
          return (
            <div
              key={stage.id}
              style={{
                minWidth: "280px",
                flex: "1 1 280px",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0 8px 16px 8px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <span style={{ fontSize: "14px", fontWeight: "600" }}>
                    {stage.title}
                  </span>
                  <span
                    style={{
                      backgroundColor: "var(--glass)",
                      padding: "2px 8px",
                      borderRadius: "10px",
                      fontSize: "12px",
                      color: "var(--text-muted)",
                    }}
                  >
                    {stageLeads.length}
                  </span>
                </div>
              </div>

              <div
                style={{
                  backgroundColor:
                    dragOverStage === stage.id
                      ? "rgba(14, 165, 233, 0.08)"
                      : "var(--column-bg)",
                  borderRadius: "12px",
                  padding: "12px",
                  flex: 1,
                  border:
                    dragOverStage === stage.id
                      ? "1px solid var(--primary)"
                      : "1px solid var(--border)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  transition:
                    "border-color 0.2s ease, background-color 0.2s ease",
                }}
                onDragOver={(event) => handleStageDragOver(event, stage.id)}
                onDrop={(event) => handleStageDrop(event, stage.id)}
                onDragLeave={() => {
                  if (dragOverStage === stage.id) {
                    setDragOverStage(null);
                  }
                }}
              >
                <AnimatePresence>
                  {stageLeads.map((lead) => (
                    <KanbanCard
                      key={lead.id}
                      lead={lead}
                      onClick={() => setSelectedLeadId(lead.id)}
                      onStatusChange={handleUpdateStatus}
                      stages={stages}
                      onDragStart={handleLeadDragStart}
                      onDragEnd={handleLeadDragEnd}
                      isDragging={draggedLeadId === lead.id}
                      dragDisabled={actionLoading === lead.id}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {selectedLeadId && (
          <LeadSidePanel
            leadId={selectedLeadId}
            onClose={() => setSelectedLeadId(null)}
          />
        )}
      </AnimatePresence>

      {showAddModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 110,
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="glass-card"
            style={{ width: "min(90vw, 500px)", padding: "24px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "20px",
              }}
            >
              <h3 style={{ fontSize: "20px", fontWeight: "700" }}>
                Create New Lead
              </h3>
              <button onClick={() => setShowAddModal(false)}>
                <X size={20} style={{ color: "var(--text-main)" }} />
              </button>
            </div>
            <form
              onSubmit={handleCreateLead}
              style={{ display: "grid", gap: "12px" }}
            >
              <input
                type="text"
                required
                placeholder="Full Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  backgroundColor: "var(--input-bg)",
                  border: "1px solid var(--border)",
                  color: "var(--text-main)",
                }}
              />
              <input
                type="text"
                placeholder="Company Name"
                value={formData.company}
                onChange={(e) =>
                  setFormData({ ...formData, company: e.target.value })
                }
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "8px",
                  backgroundColor: "var(--input-bg)",
                  border: "1px solid var(--border)",
                  color: "var(--text-main)",
                }}
              />
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                }}
              >
                <input
                  type="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    backgroundColor: "var(--input-bg)",
                    border: "1px solid var(--border)",
                    color: "var(--text-main)",
                  }}
                />
                <input
                  type="text"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    backgroundColor: "var(--input-bg)",
                    border: "1px solid var(--border)",
                    color: "var(--text-main)",
                  }}
                />
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "12px",
                }}
              >
                <select
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({ ...formData, priority: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    backgroundColor: "var(--input-bg)",
                    border: "1px solid var(--border)",
                    color: "var(--text-main)",
                  }}
                >
                  <option value="High">High Priority</option>
                  <option value="Medium">Medium Priority</option>
                  <option value="Low">Low Priority</option>
                </select>
                <input
                  type="number"
                  placeholder="Estimated Value"
                  value={formData.value}
                  onChange={(e) =>
                    setFormData({ ...formData, value: e.target.value })
                  }
                  style={{
                    width: "100%",
                    padding: "10px",
                    borderRadius: "8px",
                    backgroundColor: "var(--input-bg)",
                    border: "1px solid var(--border)",
                    color: "var(--text-main)",
                  }}
                />
              </div>
              <button
                type="submit"
                className="btn-primary"
                disabled={submitting}
                style={{
                  marginTop: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                {submitting ? (
                  <Loader size={18} className="spinner" />
                ) : (
                  "Create Lead"
                )}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Leads;
