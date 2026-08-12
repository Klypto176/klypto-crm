import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CalendarCheck2,
  ShieldAlert,
  CheckCircle2,
  Clock3,
  XCircle,
  Plus,
  Loader,
} from "lucide-react";
import apiClient from "../../api/apiClient";

const LeaveManagement = () => {
  const [requests, setRequests] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: "",
    type: "Annual",
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [actionLoading, setActionLoading] = useState(null); // ID of record being updated
  const [statusFilter, setStatusFilter] = useState("All");

  const fetchData = async () => {
    try {
      const [leavesRes, empRes] = await Promise.all([
        apiClient.get("/leaves"),
        apiClient.get("/employees"),
      ]);
      setRequests(leavesRes.data);
      setEmployees(empRes.data);
    } catch (err) {
      console.error("Failed to fetch leave data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStatusUpdate = async (id, status) => {
    setActionLoading(id);
    try {
      await apiClient.patch(`/leaves/${id}/status`, { status });
      fetchData();
    } catch (err) {
      console.error("Failed to update leave status", err);
      alert("Failed to update leave status");
    } finally {
      setActionLoading(null);
    }
  };

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const submissionData = {
        ...formData,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
      };
      await apiClient.post("/leaves", submissionData);
      setShowModal(false);
      setFormData({
        employeeId: "",
        type: "Annual",
        startDate: "",
        endDate: "",
        reason: "",
      });
      fetchData();
    } catch (err) {
      console.error("Failed to apply leave", err);
      const msg = err.message || err; // apiClient returns message string
      alert(
        `Failed to apply leave: ${Array.isArray(msg) ? msg.join(", ") : msg}`,
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "200px",
        }}
      >
        <Loader className="spinner" size={24} color="var(--text-muted)" />
      </div>
    );
  }

  const filteredRequests = requests.filter(
    (request) => statusFilter === "All" || request.status === statusFilter,
  );

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h2 style={{ fontSize: "20px", fontWeight: "700" }}>
          Leave Management
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="btn-primary"
          style={{ display: "flex", alignItems: "center", gap: "8px" }}
        >
          <Plus size={18} /> Apply Leave
        </button>
      </div>

      <div className="glass-card" style={{ padding: "24px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "16px",
          }}
        >
          <h3
            style={{
              fontSize: "18px",
              fontWeight: "700",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              margin: 0,
            }}
          >
            <CalendarCheck2 size={18} /> Leave Requests
          </h3>
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            style={{
              padding: "8px 10px",
              borderRadius: "8px",
              backgroundColor: "var(--input-bg)",
              border: "1px solid var(--border)",
              color: "var(--text-main)",
              fontSize: "12px",
              fontWeight: "600",
            }}
          >
            {["All", "Pending", "Approved", "Rejected"].map((statusOption) => (
              <option key={statusOption} value={statusOption}>
                {statusOption}
              </option>
            ))}
          </select>
        </div>
        <div style={{ display: "grid", gap: "12px" }}>
          {filteredRequests.length === 0 ? (
            <div style={{ color: "var(--text-muted)", fontSize: "14px" }}>
              No leave requests found for selected filter.
            </div>
          ) : (
            filteredRequests.map((request) => (
              <div
                key={request.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "16px",
                  alignItems: "center",
                  padding: "14px",
                  borderRadius: "12px",
                  backgroundColor: "var(--column-bg)",
                  border: "1px solid var(--border)",
                }}
              >
                <div>
                  <div style={{ fontSize: "14px", fontWeight: "700" }}>
                    {request.employee?.name || "Unknown"}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    {request.type} ·{" "}
                    {new Date(request.startDate).toLocaleDateString()} -{" "}
                    {new Date(request.endDate).toLocaleDateString()}
                  </div>
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <div
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      fontSize: "12px",
                      fontWeight: "600",
                      color:
                        request.status === "Approved"
                          ? "#10b981"
                          : request.status === "Rejected"
                            ? "#ef4444"
                            : "#f59e0b",
                    }}
                  >
                    {request.status === "Approved" ? (
                      <CheckCircle2 size={14} />
                    ) : request.status === "Rejected" ? (
                      <XCircle size={14} />
                    ) : (
                      <Clock3 size={14} />
                    )}
                    {request.status}
                  </div>
                  {request.status === "Pending" && (
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        className="btn-primary"
                        onClick={() =>
                          handleStatusUpdate(request.id, "Approved")
                        }
                        disabled={actionLoading === request.id}
                        style={{
                          padding: "6px 14px",
                          backgroundColor: "#10b981",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        {actionLoading === request.id ? (
                          <Loader size={14} className="spinner" />
                        ) : (
                          <CheckCircle2 size={16} />
                        )}{" "}
                        Approve
                      </button>
                      <button
                        className="btn-primary"
                        onClick={() =>
                          handleStatusUpdate(request.id, "Rejected")
                        }
                        disabled={actionLoading === request.id}
                        style={{
                          padding: "6px 14px",
                          backgroundColor: "#ef4444",
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                        }}
                      >
                        {actionLoading === request.id ? (
                          <Loader size={14} className="spinner" />
                        ) : (
                          <XCircle size={16} />
                        )}{" "}
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 100,
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
                marginBottom: "24px",
              }}
            >
              <h3 style={{ fontSize: "20px", fontWeight: "700" }}>
                Apply Leave
              </h3>
              <button
                onClick={() => setShowModal(false)}
                style={{ color: "var(--text-muted)" }}
              >
                <XCircle size={20} />
              </button>
            </div>

            <form
              onSubmit={handleApplyLeave}
              style={{ display: "grid", gap: "16px" }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    marginBottom: "8px",
                    color: "var(--text-muted)",
                  }}
                >
                  Select Employee
                </label>
                <select
                  required
                  value={formData.employeeId}
                  onChange={(e) =>
                    setFormData({ ...formData, employeeId: e.target.value })
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
                  <option value="">Select Employee</option>
                  {employees.map((emp) => (
                    <option
                      key={emp.id}
                      value={emp.id}
                      style={{ backgroundColor: "var(--bg-dark)" }}
                    >
                      {emp.name} ({emp.code})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    marginBottom: "8px",
                    color: "var(--text-muted)",
                  }}
                >
                  Leave Type
                </label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) =>
                    setFormData({ ...formData, type: e.target.value })
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
                  <option value="Annual">Annual Leave</option>
                  <option value="Sick">Sick Leave</option>
                  <option value="Casual">Casual Leave</option>
                  <option value="Half-Day">Half-Day Leave</option>
                  <option value="Duty">Duty Leave</option>
                </select>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "16px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      marginBottom: "8px",
                      color: "var(--text-muted)",
                    }}
                  >
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) =>
                      setFormData({ ...formData, startDate: e.target.value })
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
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "13px",
                      marginBottom: "8px",
                      color: "var(--text-muted)",
                    }}
                  >
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) =>
                      setFormData({ ...formData, endDate: e.target.value })
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
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    marginBottom: "8px",
                    color: "var(--text-muted)",
                  }}
                >
                  Reason
                </label>
                <textarea
                  value={formData.reason}
                  onChange={(e) =>
                    setFormData({ ...formData, reason: e.target.value })
                  }
                  style={{
                    width: "100%",
                    minHeight: "80px",
                    padding: "10px",
                    borderRadius: "8px",
                    backgroundColor: "var(--input-bg)",
                    border: "1px solid var(--border)",
                    color: "var(--text-main)",
                    resize: "none",
                  }}
                />
              </div>

              <button
                type="submit"
                className="btn-primary"
                disabled={submitting}
                style={{ marginTop: "12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
              >
                {submitting && <Loader className="spinner" size={16} />}
                Submit Request
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default LeaveManagement;
