import React, { useState, useEffect } from "react";
import {
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  ShieldAlert,
  Loader,
  Calendar,
  IndianRupee,
  User,
  CheckCircle2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import apiClient from "../../api/apiClient";

const ApprovalQueue = () => {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(null); // ID of the item being processed

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/approvals/pending");
      setApprovals(res.data);
    } catch (err) {
      console.error("Failed to fetch approvals", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAction = async (id, type, action) => {
    setActioning(id);
    try {
      await apiClient.post("/approvals/action", { id, type, action });
      setApprovals(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error("Failed to process approval action", err);
      alert("Failed to process approval action");
    } finally {
      setActioning(null);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div className="glass-card" style={{ padding: "24px" }}>
        <div
          className="erp-approval-header"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "32px",
          }}
        >
          <div>
            <h3 style={{ fontSize: "20px", fontWeight: "800", display: "flex", alignItems: "center", gap: "10px" }}>
              <ShieldAlert size={22} className="text-primary" /> Approval Oversight
            </h3>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>Centralized queue for cross-module workflow approvals.</p>
          </div>
          {!loading && (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <button 
                onClick={fetchData} 
                className="glass-card" 
                style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: "600", color: "var(--text-muted)" }}
              >
                <Loader size={14} className={loading ? "spinner" : ""} /> Refresh
              </button>
              <div style={{ padding: "6px 16px", backgroundColor: "var(--tag-bg)", borderRadius: "20px", fontSize: "12px", fontWeight: "700", color: "var(--primary)" }}>
                {approvals.length} Pending Task{approvals.length !== 1 ? 's' : ''}
              </div>
            </div>
          )}
        </div>

        {loading ? (
          <div style={{ height: "300px", display: "flex", alignItems: "center", justifyContent: "center" }}><Loader className="spinner" size={40} /></div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <AnimatePresence mode="popLayout">
              {approvals.map((req) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  key={req.id}
                  className="erp-approval-item"
                  style={{
                    padding: "24px",
                    backgroundColor: "var(--tag-bg)",
                    borderRadius: "16px",
                    border: "1px solid var(--border)",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                    transition: "all 0.2s"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", flexWrap: "wrap", marginBottom: "16px" }}>
                    <div style={{ display: "flex", gap: "16px" }}>
                      <div style={{ 
                        width: "48px", height: "48px", borderRadius: "12px", 
                        backgroundColor: req.type === 'LEAVE' ? "rgba(139, 92, 246, 0.1)" : "rgba(16, 185, 129, 0.1)", 
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: req.type === 'LEAVE' ? "#8b5cf6" : "#10b981"
                      }}>
                        {req.type === 'LEAVE' ? <Calendar size={20} /> : <IndianRupee size={20} />}
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                          <span style={{ fontWeight: "800", fontSize: "16px" }}>{req.title}</span>
                          <span style={{ fontSize: "11px", color: "var(--text-muted)", backgroundColor: "var(--input-bg)", padding: "2px 8px", borderRadius: "4px" }}>#{req.id.substring(0, 8).toUpperCase()}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text-muted)" }}>
                          <User size={14} /> <span>{req.requester}</span>
                          <span>•</span>
                          <Clock size={14} /> <span>{new Date(req.date).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: "800", fontSize: "18px", marginBottom: "4px" }}>{req.amount || "N/A"}</div>
                      <div style={{ fontSize: "10px", fontWeight: "900", color: req.priority === "High" ? "#ef4444" : "#f59e0b", letterSpacing: "1px" }}>{req.priority.toUpperCase()} PRIORITY</div>
                    </div>
                  </div>

                  <p style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)", marginBottom: "24px", lineHeight: "1.6", backgroundColor: "var(--input-bg)", padding: "12px", borderRadius: "8px", borderLeft: "3px solid var(--primary)" }}>
                    {req.description}
                  </p>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                    <button style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", color: "var(--text-muted)", fontWeight: "600", padding: "8px 12px", borderRadius: "8px", border: "1px solid transparent" }} onMouseEnter={(e) => e.target.style.borderColor = "var(--border)"} onMouseLeave={(e) => e.target.style.borderColor = "transparent"}>
                      <ExternalLink size={14} /> Full Context
                    </button>
                    <div style={{ display: "flex", gap: "16px" }}>
                      <button 
                        onClick={() => handleAction(req.id, req.type, 'REJECT')}
                        disabled={actioning === req.id}
                        className="btn-danger-outline" 
                        style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 24px", borderRadius: "10px", fontWeight: "700" }}
                      >
                        {actioning === req.id ? <Loader size={16} className="spinner" /> : <XCircle size={18} />} Reject
                      </button>
                      <button 
                        onClick={() => handleAction(req.id, req.type, 'APPROVE')}
                        disabled={actioning === req.id}
                        className="btn-primary" 
                        style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 24px", borderRadius: "10px", fontWeight: "700" }}
                      >
                        {actioning === req.id ? <Loader size={16} className="spinner" /> : <CheckCircle2 size={18} />} Approve
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {approvals.length === 0 && (
              <div style={{ textAlign: "center", padding: "80px 40px", backgroundColor: "rgba(255,255,255,0.02)", borderRadius: "24px", border: "2px dashed var(--border)" }}>
                <CheckCircle size={48} style={{ color: "var(--primary)", opacity: 0.3, marginBottom: "16px" }} />
                <h4 style={{ fontSize: "18px", fontWeight: "700", color: "var(--text-main)" }}>All Caught Up!</h4>
                <p style={{ fontSize: "14px", color: "var(--text-muted)", marginTop: "8px" }}>No pending approvals are waiting for your review.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApprovalQueue;
