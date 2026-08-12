import React, { useEffect, useState } from "react";
import {
  AlertTriangle,
  ShieldAlert,
  Clock,
  CheckCircle2,
  MessageSquare,
  Flag,
  MoreVertical,
  Plus,
  ArrowUpRight,
  Search,
  Send,
  Loader,
  XCircle,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import apiClient from "../../api/apiClient";

const GrievanceManagement = () => {
  const [view, setView] = useState("dashboard");
  const [grievances, setGrievances] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // ID of grievance being updated
  const [selectedGrievance, setSelectedGrievance] = useState(null);
  const [statusFilter, setStatusFilter] = useState("All");
  const [severityFilter, setSeverityFilter] = useState("All");

  const [formData, setFormData] = useState({
    subject: "",
    category: "General",
    description: "",
    severity: "Medium",
  });

  const fetchData = async () => {
    try {
      const [grievanceRes, statsRes] = await Promise.all([
        apiClient.get("/grievances"),
        apiClient.get("/grievances/stats"),
      ]);
      setGrievances(grievanceRes.data);
      setStats(statsRes.data);
    } catch (err) {
      console.error("Failed to fetch grievance data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.post("/grievances", { ...formData });
      setFormData({
        subject: "",
        category: "General",
        description: "",
        severity: "Medium",
      });
      setView("dashboard");
      fetchData();
    } catch (err) {
      console.error("Failed to submit grievance", err);
      alert("Failed to submit grievance");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    setActionLoading(id);
    try {
      await apiClient.patch(`/grievances/${id}`, { status });
      await fetchData();
    } catch (err) {
      console.error("Failed to update status", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteGrievance = async (id) => {
    if (!window.confirm("Permanently remove this grievance record?")) return;
    setActionLoading(id);
    try {
      await apiClient.delete(`/grievances/${id}`);
      await fetchData();
    } catch (err) {
      console.error("Failed to delete grievance", err);
      alert("Failed to delete grievance");
    } finally {
      setActionLoading(null);
    }
  };

  const getSeverityColor = (sev) => {
    switch (sev) {
      case "Critical":
        return "#ef4444";
      case "High":
        return "#f59e0b";
      case "Medium":
        return "var(--primary)";
      default:
        return "var(--text-muted)";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Resolved":
        return "#10b981";
      case "Escalated":
        return "#ef4444";
      case "In Review":
        return "#3b82f6";
      default:
        return "var(--text-muted)";
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
        <Loader className="spinner" size={32} />
      </div>
    );
  }

  const filteredGrievances = grievances.filter((grievance) => {
    const statusMatch =
      statusFilter === "All" || grievance.status === statusFilter;
    const severityMatch =
      severityFilter === "All" || grievance.severity === severityFilter;
    return statusMatch && severityMatch;
  });

  const hasActiveFilters = statusFilter !== "All" || severityFilter !== "All";
  const activeFilterSummary = [
    statusFilter !== "All" ? `Status: ${statusFilter}` : null,
    severityFilter !== "All" ? `Severity: ${severityFilter}` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const renderView = () => {
    switch (view) {
      case "dashboard":
        return (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "24px" }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "20px",
              }}
            >
              <div className="glass-card" style={{ padding: "20px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "12px",
                  }}
                >
                  <div
                    style={{
                      padding: "8px",
                      borderRadius: "8px",
                      backgroundColor: "var(--tag-bg)",
                      color: "var(--primary)",
                    }}
                  >
                    <MessageSquare size={18} />
                  </div>
                </div>
                <div style={{ fontSize: "24px", fontWeight: "800" }}>
                  {stats?.total || 0}
                </div>
                <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                  Total Grievances
                </div>
              </div>
              <div className="glass-card" style={{ padding: "20px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "12px",
                  }}
                >
                  <div
                    style={{
                      padding: "8px",
                      borderRadius: "8px",
                      backgroundColor: "var(--tag-bg)",
                      color: "#f59e0b",
                    }}
                  >
                    <Clock size={18} />
                  </div>
                </div>
                <div style={{ fontSize: "24px", fontWeight: "800" }}>
                  {stats?.unresolved || 0}
                </div>
                <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                  Unresolved
                </div>
              </div>
              <div className="glass-card" style={{ padding: "20px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "12px",
                  }}
                >
                  <div
                    style={{
                      padding: "8px",
                      borderRadius: "8px",
                      backgroundColor: "var(--tag-bg)",
                      color: "#ef4444",
                    }}
                  >
                    <AlertTriangle size={18} />
                  </div>
                </div>
                <div style={{ fontSize: "24px", fontWeight: "800" }}>
                  {stats?.critical || 0}
                </div>
                <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                  Critical / High
                </div>
              </div>
              <div className="glass-card" style={{ padding: "20px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: "12px",
                  }}
                >
                  <div
                    style={{
                      padding: "8px",
                      borderRadius: "8px",
                      backgroundColor: "var(--tag-bg)",
                      color: "#10b981",
                    }}
                  >
                    <CheckCircle2 size={18} />
                  </div>
                </div>
                <div style={{ fontSize: "24px", fontWeight: "800" }}>
                  {stats?.resolved || 0}
                </div>
                <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                  Resolved (MTD)
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: "24px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "20px",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <h3 style={{ fontWeight: "700" }}>Recent Grievances</h3>
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    flexWrap: "wrap",
                    alignItems: "flex-end",
                    justifyContent: "flex-end",
                  }}
                >
                  <div style={{ display: "grid", gap: "4px" }}>
                    <label
                      style={{
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        fontWeight: "700",
                      }}
                    >
                      Filter by complaint status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value)}
                      style={{
                        padding: "8px 10px",
                        borderRadius: "8px",
                        backgroundColor: "var(--input-bg)",
                        border: "1px solid var(--border)",
                        color: "var(--text-main)",
                        fontSize: "12px",
                        fontWeight: "600",
                        minWidth: "190px",
                      }}
                    >
                      {[
                        "All",
                        "Open",
                        "In Review",
                        "Escalated",
                        "Resolved",
                      ].map((statusOption) => (
                        <option key={statusOption} value={statusOption}>
                          {statusOption === "All"
                            ? "All Statuses"
                            : statusOption}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: "grid", gap: "4px" }}>
                    <label
                      style={{
                        fontSize: "11px",
                        color: "var(--text-muted)",
                        fontWeight: "700",
                      }}
                    >
                      Filter by severity level
                    </label>
                    <select
                      value={severityFilter}
                      onChange={(e) => setSeverityFilter(e.target.value)}
                      style={{
                        padding: "8px 10px",
                        borderRadius: "8px",
                        backgroundColor: "var(--input-bg)",
                        border: "1px solid var(--border)",
                        color: "var(--text-main)",
                        fontSize: "12px",
                        fontWeight: "600",
                        minWidth: "190px",
                      }}
                    >
                      {["All", "Low", "Medium", "High", "Critical"].map(
                        (severityOption) => (
                          <option key={severityOption} value={severityOption}>
                            {severityOption === "All"
                              ? "All Severities"
                              : severityOption}
                          </option>
                        ),
                      )}
                    </select>
                  </div>

                  <button
                    className="btn-primary"
                    onClick={() => setView("submit")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Plus size={18} /> New Complaint
                  </button>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "8px",
                  marginBottom: "12px",
                  color: "var(--text-muted)",
                  fontSize: "12px",
                }}
              >
                <span>
                  Showing {filteredGrievances.length} of {grievances.length}{" "}
                  grievances
                </span>
                <div
                  style={{ display: "flex", gap: "10px", alignItems: "center" }}
                >
                  {hasActiveFilters ? (
                    <span>Active filters: {activeFilterSummary}</span>
                  ) : (
                    <span>Active filters: None</span>
                  )}
                  {hasActiveFilters ? (
                    <button
                      type="button"
                      onClick={() => {
                        setStatusFilter("All");
                        setSeverityFilter("All");
                      }}
                      style={{
                        border: "1px solid var(--border)",
                        backgroundColor: "var(--input-bg)",
                        color: "var(--text-main)",
                        borderRadius: "8px",
                        padding: "6px 10px",
                        fontSize: "12px",
                        fontWeight: "600",
                      }}
                    >
                      Clear Filters
                    </button>
                  ) : null}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {filteredGrievances.length === 0 ? (
                  <div
                    style={{
                      color: "var(--text-muted)",
                      fontSize: "14px",
                      padding: "16px",
                    }}
                  >
                    No grievances found for selected filters.
                  </div>
                ) : (
                  filteredGrievances.map((grv) => (
                    <div
                      key={grv.id}
                      onClick={() => setSelectedGrievance(grv)}
                      style={{
                        padding: "16px",
                        borderRadius: "12px",
                        border: "1px solid var(--border)",
                        backgroundColor: "var(--tag-bg)",
                        display: "flex",
                        alignItems: "center",
                        gap: "20px",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "10px",
                          backgroundColor: "var(--input-bg)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: getSeverityColor(grv.severity),
                        }}
                      >
                        <ShieldAlert size={20} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "4px",
                          }}
                        >
                          <span style={{ fontWeight: "700" }}>
                            {grv.subject}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "var(--text-muted)",
                          }}
                        >
                          ID: {grv.id.substring(0, 8)} • {grv.category} •{" "}
                          {new Date(grv.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div style={{ textAlign: "right", minWidth: "150px" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                            justifyContent: "flex-end",
                          }}
                        >
                          {actionLoading === grv.id && (
                            <Loader size={12} className="spinner" />
                          )}
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              handleDeleteGrievance(grv.id);
                            }}
                            disabled={actionLoading === grv.id}
                            style={{ color: "var(--text-muted)", opacity: 0.6 }}
                            onMouseEnter={(e) =>
                              (e.currentTarget.style.color = "#ef4444")
                            }
                            onMouseLeave={(e) =>
                              (e.currentTarget.style.color =
                                "var(--text-muted)")
                            }
                          >
                            <Trash2 size={14} />
                          </button>
                          <select
                            value={grv.status}
                            disabled={actionLoading === grv.id}
                            onClick={(event) => event.stopPropagation()}
                            onChange={(e) =>
                              handleUpdateStatus(grv.id, e.target.value)
                            }
                            style={{
                              backgroundColor: "transparent",
                              border: "none",
                              color: getStatusColor(grv.status),
                              fontSize: "11px",
                              fontWeight: "700",
                              outline: "none",
                              cursor: "pointer",
                            }}
                          >
                            {["Open", "In Review", "Escalated", "Resolved"].map(
                              (s) => (
                                <option key={s} value={s}>
                                  {s.toUpperCase()}
                                </option>
                              ),
                            )}
                          </select>
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "var(--text-muted)",
                            marginTop: "4px",
                          }}
                        >
                          Severity:{" "}
                          <span
                            style={{ color: getSeverityColor(grv.severity) }}
                          >
                            {grv.severity}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );

      case "submit":
        return (
          <div
            className="glass-card"
            style={{ maxWidth: "700px", margin: "0 auto", padding: "32px" }}
          >
            <h2
              style={{
                fontSize: "24px",
                fontWeight: "800",
                marginBottom: "8px",
              }}
            >
              Submit a Grievance
            </h2>
            <p style={{ color: "var(--text-muted)", marginBottom: "32px" }}>
              Provide details about your concern. We ensure fair evaluation for
              all cases.
            </p>
            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "24px" }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "600",
                    marginBottom: "8px",
                  }}
                >
                  Reason / Subject
                </label>
                <input
                  required
                  type="text"
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  placeholder="Brief summary"
                  style={{
                    width: "100%",
                    padding: "14px",
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
                  gap: "20px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "600",
                      marginBottom: "8px",
                    }}
                  >
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "14px",
                      borderRadius: "8px",
                      backgroundColor: "var(--input-bg)",
                      border: "1px solid var(--border)",
                      color: "var(--text-main)",
                    }}
                  >
                    <option>General</option>
                    <option>Workplace Harassment</option>
                    <option>Policy Violation</option>
                    <option>Management Issue</option>
                    <option>Infrastructure / Facilities</option>
                  </select>
                </div>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "14px",
                      fontWeight: "600",
                      marginBottom: "8px",
                    }}
                  >
                    Severity
                  </label>
                  <select
                    value={formData.severity}
                    onChange={(e) =>
                      setFormData({ ...formData, severity: e.target.value })
                    }
                    style={{
                      width: "100%",
                      padding: "14px",
                      borderRadius: "8px",
                      backgroundColor: "var(--input-bg)",
                      border: "1px solid var(--border)",
                      color: "var(--text-main)",
                    }}
                  >
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                    <option>Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "14px",
                    fontWeight: "600",
                    marginBottom: "8px",
                  }}
                >
                  Description
                </label>
                <textarea
                  required
                  rows={5}
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Detailed information..."
                  style={{
                    width: "100%",
                    padding: "14px",
                    borderRadius: "8px",
                    backgroundColor: "var(--input-bg)",
                    border: "1px solid var(--border)",
                    color: "var(--text-main)",
                  }}
                ></textarea>
              </div>

              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  type="button"
                  onClick={() => setView("dashboard")}
                  style={{
                    flex: 1,
                    padding: "14px",
                    borderRadius: "10px",
                    border: "1px solid var(--border)",
                    fontWeight: "600",
                    color: "var(--text-main)",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                  style={{
                    flex: 2,
                    padding: "14px",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  {submitting ? (
                    <Loader size={18} className="spinner" />
                  ) : (
                    <>
                      <Send size={18} /> Submit Grievance
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ width: "100%", maxWidth: "1200px", margin: "0 auto" }}>
      <header
        style={{
          marginBottom: "32px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
        }}
      >
        <div>
          <h1
            style={{ fontSize: "32px", fontWeight: "800", marginBottom: "4px" }}
          >
            Grievance Management
          </h1>
          <p style={{ color: "var(--text-muted)" }}>
            Ensuring workplace fairness and transparency.
          </p>
        </div>
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={() => setView("dashboard")}
            style={{
              padding: "8px 16px",
              borderRadius: "8px",
              backgroundColor:
                view === "dashboard" ? "var(--primary)" : "var(--tag-bg)",
              color: view === "dashboard" ? "white" : "var(--text-main)",
              fontSize: "14px",
              fontWeight: "600",
            }}
          >
            Dashboard
          </button>
        </div>
      </header>
      <main>{renderView()}</main>

      <AnimatePresence>
        {selectedGrievance && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 120,
              backgroundColor: "rgba(0,0,0,0.55)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "16px",
            }}
            onClick={() => setSelectedGrievance(null)}
          >
            <motion.div
              initial={{ y: 16, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 12, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="glass-card"
              style={{
                width: "min(760px, 100%)",
                maxHeight: "90vh",
                overflowY: "auto",
                padding: "22px",
              }}
              onClick={(event) => event.stopPropagation()}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "16px",
                  gap: "12px",
                }}
              >
                <div>
                  <h3 style={{ fontSize: "20px", fontWeight: "800" }}>
                    Complaint Details
                  </h3>
                  <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    ID: {selectedGrievance.id}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedGrievance(null)}
                  style={{ color: "var(--text-main)" }}
                >
                  <XCircle size={22} />
                </button>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "10px",
                  marginBottom: "16px",
                }}
              >
                <div className="glass-card" style={{ padding: "10px" }}>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    Subject
                  </div>
                  <div style={{ fontWeight: "700", marginTop: "4px" }}>
                    {selectedGrievance.subject}
                  </div>
                </div>
                <div className="glass-card" style={{ padding: "10px" }}>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    Category
                  </div>
                  <div style={{ fontWeight: "700", marginTop: "4px" }}>
                    {selectedGrievance.category}
                  </div>
                </div>
                <div className="glass-card" style={{ padding: "10px" }}>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    Severity
                  </div>
                  <div
                    style={{
                      fontWeight: "700",
                      marginTop: "4px",
                      color: getSeverityColor(selectedGrievance.severity),
                    }}
                  >
                    {selectedGrievance.severity}
                  </div>
                </div>
                <div className="glass-card" style={{ padding: "10px" }}>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                    Status
                  </div>
                  <div
                    style={{
                      fontWeight: "700",
                      marginTop: "4px",
                      color: getStatusColor(selectedGrievance.status),
                    }}
                  >
                    {selectedGrievance.status}
                  </div>
                </div>
              </div>

              <div className="glass-card" style={{ padding: "14px" }}>
                <div
                  style={{
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    marginBottom: "6px",
                  }}
                >
                  Detailed Description
                </div>
                <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.45 }}>
                  {selectedGrievance.description || "No description provided."}
                </p>
              </div>

              <div
                style={{
                  marginTop: "14px",
                  fontSize: "12px",
                  color: "var(--text-muted)",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "8px",
                  flexWrap: "wrap",
                }}
              >
                <span>
                  Reported:{" "}
                  {new Date(selectedGrievance.createdAt).toLocaleString()}
                </span>

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GrievanceManagement;
