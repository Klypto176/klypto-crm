import React, { useEffect, useRef, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Banknote,
  Wallet,
  FileText,
  CheckCircle2,
  AlertCircle,
  Plus,
  ArrowLeft,
  Download,
  BarChart3,
  Scale,
  IndianRupee,
  PieChart,
  UserCheck,
  Building,
  Loader,
  X,
  AlertTriangle,
  Play,
  Hash,
} from "lucide-react";
import apiClient from "../../api/apiClient";
import { formatCurrency as fmtCurrency } from "../../utils/currency";

// ── Month names ─────────────────────────────────────────────────────────────
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// ── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const colors = {
    Paid: { bg: "rgba(16,185,129,0.12)", text: "#10b981" },
    Pending: { bg: "rgba(245,158,11,0.12)", text: "#f59e0b" },
    Failed: { bg: "rgba(239,68,68,0.12)", text: "#ef4444" },
  };
  const c = colors[status] || colors.Pending;
  return (
    <span
      style={{
        fontSize: "11px",
        fontWeight: "700",
        padding: "3px 10px",
        borderRadius: "20px",
        backgroundColor: c.bg,
        color: c.text,
      }}
    >
      {status}
    </span>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────
const Payroll = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const navigate = useNavigate();
  const tabNavRef = useRef(null);
  const dragState = useRef({ isDragging: false, startX: 0, scrollLeft: 0 });

  // ── Data state ──────────────────────────────────────────────────────────
  const [stats, setStats] = useState(null);
  const [structures, setStructures] = useState([]);
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [structureDepartmentFilter, setStructureDepartmentFilter] =
    useState("all");
  const [payslipStatusFilter, setPayslipStatusFilter] = useState("all");
  const [payslipMonthFilter, setPayslipMonthFilter] = useState("all");

  // ── Modal state — Salary Structure ─────────────────────────────────────
  const [showStructModal, setShowStructModal] = useState(false);
  const [submitStruct, setSubmitStruct] = useState(false);
  const [structError, setStructError] = useState(null);
  const [structForm, setStructForm] = useState({
    employeeId: "",
    basicSalary: "",
    hra: "",
    allowances: "",
    deductions: "",
  });

  // ── Process Payroll modal ───────────────────────────────────────────────
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [processingPayroll, setProcessingPayroll] = useState(false);
  const [processError, setProcessError] = useState(null);
  const [processForm, setProcessForm] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  // ── Fetch all data ──────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, structRes, recRes, empRes] = await Promise.all([
        apiClient.get("/payroll/stats"),
        apiClient.get("/payroll/structures"),
        apiClient.get("/payroll/records"),
        apiClient.get("/employees"),
      ]);
      setStats(
        structRes.data.length === 0
          ? { ...statsRes.data, employeesOnPayroll: 0 }
          : statsRes.data,
      );
      setStructures(structRes.data);
      setRecords(recRes.data);
      setEmployees(empRes.data);
    } catch (e) {
      console.error("Payroll fetch failed", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // ── Tab helpers ─────────────────────────────────────────────────────────
  useEffect(() => {
    tabNavRef.current
      ?.querySelector(`[data-payroll-tab="${activeTab}"]`)
      ?.scrollIntoView({
        behavior: "smooth",
        inline: "center",
        block: "nearest",
      });
  }, [activeTab]);

  const onDragStart = (e) => {
    dragState.current = {
      isDragging: true,
      startX: e.clientX,
      scrollLeft: tabNavRef.current.scrollLeft,
    };
    tabNavRef.current?.classList.add("is-dragging");
  };
  const onDragMove = (e) => {
    if (!dragState.current.isDragging) return;
    e.preventDefault();
    tabNavRef.current.scrollLeft =
      dragState.current.scrollLeft - (e.clientX - dragState.current.startX);
  };
  const onDragEnd = () => {
    dragState.current.isDragging = false;
    tabNavRef.current?.classList.remove("is-dragging");
  };

  // ── Submit salary structure ─────────────────────────────────────────────
  const handleSubmitStructure = async (e) => {
    e.preventDefault();
    setStructError(null);
    setSubmitStruct(true);
    try {
      const payload = {
        employeeId: structForm.employeeId,
        basicSalary: Number(structForm.basicSalary),
        hra: Number(structForm.hra),
        allowances: Number(structForm.allowances),
        deductions: Number(structForm.deductions),
      };
      await apiClient.post("/payroll/structures", payload);
      await fetchAll();
      setShowStructModal(false);
      setStructForm({
        employeeId: "",
        basicSalary: "",
        hra: "",
        allowances: "",
        deductions: "",
      });
    } catch (err) {
      setStructError(
        err.response?.data?.message || "Failed to save salary structure.",
      );
    } finally {
      setSubmitStruct(false);
    }
  };

  // ── Process payroll ─────────────────────────────────────────────────────
  const handleExportCSV = () => {
    if (records.length === 0) return alert("No records to export.");
    const headers = ["Employee,Month,Year,Net Pay,Status"];
    const rows = records.map(
      (r) =>
        `${r.employee?.name},${MONTHS[r.month - 1]},${r.year},${r.netPay},${r.status}`,
    );
    const csvContent =
      "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `payroll_report_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleProcessPayroll = async (e) => {
    e.preventDefault();
    setProcessError(null);
    setProcessingPayroll(true);
    try {
      await apiClient.post("/payroll/process", {
        month: Number(processForm.month),
        year: Number(processForm.year),
      });
      await fetchAll();
      setShowProcessModal(false);
      setActiveTab("payslips");
    } catch (err) {
      setProcessError(
        err.response?.data?.message || "Failed to process payroll.",
      );
    } finally {
      setProcessingPayroll(false);
    }
  };

  const tabs = [
    { id: "overview", label: "Overview", icon: <PieChart size={16} /> },
    {
      id: "structures",
      label: "Salary Structures",
      icon: <IndianRupee size={16} />,
    },
    { id: "payslips", label: "Payslips", icon: <FileText size={16} /> },
    { id: "compliance", label: "Compliance", icon: <Scale size={16} /> },
    { id: "reports", label: "Reports", icon: <BarChart3 size={16} /> },
  ];

  const structureDepartments = Array.from(
    new Set(
      structures.map((item) => item.employee?.department).filter(Boolean),
    ),
  );

  const filteredStructures = structures.filter((item) => {
    if (structureDepartmentFilter === "all") return true;
    return item.employee?.department === structureDepartmentFilter;
  });

  const filteredRecords = records.filter((item) => {
    const statusMatch =
      payslipStatusFilter === "all" || item.status === payslipStatusFilter;
    const monthMatch =
      payslipMonthFilter === "all" || String(item.month) === payslipMonthFilter;
    return statusMatch && monthMatch;
  });
  const hasStructureFilters = structureDepartmentFilter !== "all";
  const hasPayslipFilters =
    payslipStatusFilter !== "all" || payslipMonthFilter !== "all";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <header
        className="module-header"
        style={{ display: "flex", alignItems: "center", gap: "16px" }}
      >
        <button
          onClick={() => navigate(-1)}
          className="glass-card"
          style={{
            width: "40px",
            height: "40px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--text-muted)",
          }}
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 style={{ fontSize: "28px", fontWeight: "800" }}>
            Payroll Management
          </h2>
          <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>
            Manage salary structures, process payroll, and generate payslips.
          </p>
        </div>
      </header>

      {/* Tab nav */}
      <div
        ref={tabNavRef}
        className="glass-card module-subnav payroll-subnav"
        onPointerDown={onDragStart}
        onPointerMove={onDragMove}
        onPointerUp={onDragEnd}
        onPointerLeave={onDragEnd}
        onPointerCancel={onDragEnd}
        style={{
          display: "flex",
          gap: "4px",
          flexWrap: "nowrap",
          justifyContent: "flex-start",
          alignItems: "stretch",
          minHeight: "52px",
          padding: "6px",
          overflowX: "auto",
          overflowY: "hidden",
          width: "100%",
          scrollBehavior: "smooth",
          touchAction: "pan-x",
          scrollbarWidth: "none",
          cursor: "grab",
        }}
      >
        {tabs.map((t) => (
          <button
            key={t.id}
            data-payroll-tab={t.id}
            className="module-subnav-item"
            onClick={() => setActiveTab(t.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 16px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "600",
              transition: "all 0.2s ease",
              color: activeTab === t.id ? "white" : "var(--text-muted)",
              backgroundColor:
                activeTab === t.id ? "var(--primary)" : "transparent",
              flex: "0 0 auto",
              whiteSpace: "nowrap",
            }}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ── Overview ──────────────────────────────────────────────────── */}
        {activeTab === "overview" && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{ display: "flex", flexDirection: "column", gap: "24px" }}
          >
            {/* Stats row */}
            <div
              className="responsive-grid-4"
              style={{ display: "grid", gap: "20px" }}
            >
              {[
                {
                  label: "Employees on Payroll",
                  val: loading ? "—" : (stats?.employeesOnPayroll ?? 0),
                  icon: <UserCheck size={18} />,
                  color: "#10b981",
                },
                {
                  label: "Total Net Pay (Month)",
                  val: loading
                    ? "—"
                    : fmtCurrency(stats?.totalNetPayThisMonth ?? 0),
                  icon: <IndianRupee size={18} />,
                  color: "var(--primary)",
                },
                {
                  label: "Processed",
                  val: loading ? "—" : (stats?.processedRecords ?? 0),
                  icon: <CheckCircle2 size={18} />,
                  color: "#8b5cf6",
                },
                {
                  label: "Pending Processing",
                  val: loading ? "—" : (stats?.pendingRecords ?? 0),
                  icon: <Wallet size={18} />,
                  color: "#f59e0b",
                },
              ].map((stat) => (
                <div
                  key={stat.label}
                  className="glass-card"
                  style={{ padding: "20px" }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "12px",
                    }}
                  >
                    <div
                      style={{
                        padding: "8px",
                        borderRadius: "8px",
                        backgroundColor: "var(--tag-bg)",
                        color: stat.color,
                      }}
                    >
                      {stat.icon}
                    </div>
                    <BarChart3 size={16} color="var(--text-muted)" />
                  </div>
                  <div style={{ fontSize: "26px", fontWeight: "800" }}>
                    {stat.val}
                  </div>
                  <div
                    style={{
                      fontSize: "13px",
                      color: "var(--text-muted)",
                      marginTop: "4px",
                    }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Process Payroll CTA */}
            <div
              className="glass-card"
              style={{
                padding: "24px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "16px",
                flexWrap: "wrap",
                background:
                  "linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.06))",
                border: "1px solid rgba(99,102,241,0.2)",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: "700",
                    marginBottom: "4px",
                  }}
                >
                  Ready to process payroll?
                </div>
                <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                  {structures.length === 0
                    ? "Add salary structures first, then run payroll."
                    : `${structures.length} employee${structures.length !== 1 ? "s" : ""} have salary structures configured.`}
                </div>
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <button
                  onClick={() => {
                    setShowStructModal(true);
                    setStructError(null);
                  }}
                  className="glass-card"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "10px 20px",
                    fontSize: "14px",
                    fontWeight: "600",
                    color: "var(--text-main)",
                  }}
                >
                  <Plus size={18} /> Add Structure
                </button>
                <button
                  onClick={() => {
                    setShowProcessModal(true);
                    setProcessError(null);
                  }}
                  className="btn-primary"
                  disabled={structures.length === 0}
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <Play size={18} /> Run Payroll
                </button>
              </div>
            </div>

            {/* Recent records (this month) */}
            {!loading && stats?.recentRecords?.length > 0 && (
              <div className="glass-card" style={{ padding: "24px" }}>
                <h3 style={{ fontWeight: "700", marginBottom: "16px" }}>
                  Recent Payroll Records
                </h3>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "10px",
                  }}
                >
                  {stats.recentRecords.map((rec) => (
                    <div
                      key={rec.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "14px",
                        backgroundColor: "var(--tag-bg)",
                        borderRadius: "10px",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: "600", fontSize: "14px" }}>
                          {rec.employee?.name ?? "—"}
                        </div>
                        <div
                          style={{
                            fontSize: "11px",
                            color: "var(--text-muted)",
                          }}
                        >
                          {MONTHS[rec.month - 1]} {rec.year}
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "16px",
                        }}
                      >
                        <div style={{ fontWeight: "700", color: "#10b981" }}>
                          {fmtCurrency(rec.netPay)}
                        </div>
                        <StatusBadge status={rec.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {!loading && structures.length === 0 && (
              <div
                className="glass-card"
                style={{
                  padding: "48px 24px",
                  textAlign: "center",
                  color: "var(--text-muted)",
                }}
              >
                <Banknote
                  size={42}
                  style={{ opacity: 0.3, marginBottom: "12px" }}
                />
                <p style={{ fontWeight: "600", marginBottom: "8px" }}>
                  No salary structures yet
                </p>
                <p style={{ fontSize: "13px" }}>
                  Add salary structures to start processing payroll.
                </p>
              </div>
            )}
          </motion.div>
        )}

        {/* ── Salary Structures ─────────────────────────────────────────── */}
        {activeTab === "structures" && (
          <motion.div
            key="structures"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{ display: "flex", flexDirection: "column", gap: "24px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <h2 style={{ fontSize: "24px", fontWeight: "700" }}>
                Salary Structures ({filteredStructures.length})
              </h2>
              <button
                onClick={() => {
                  setShowStructModal(true);
                  setStructError(null);
                }}
                className="btn-primary"
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Plus size={18} /> Add / Update Structure
              </button>
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                  alignItems: "flex-end",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <label
                    style={{
                      fontSize: "11px",
                      color: "var(--text-muted)",
                      fontWeight: "700",
                      letterSpacing: "0.4px",
                    }}
                  >
                    FILTER DEPARTMENT
                  </label>
                  <select
                    value={structureDepartmentFilter}
                    onChange={(e) =>
                      setStructureDepartmentFilter(e.target.value)
                    }
                    style={{
                      padding: "10px 12px",
                      borderRadius: "8px",
                      backgroundColor: "var(--input-bg)",
                      border: "1px solid var(--border)",
                      color: "var(--text-main)",
                      fontSize: "13px",
                      minWidth: "180px",
                    }}
                  >
                    <option value="all">All Departments</option>
                    {structureDepartments.map((department) => (
                      <option key={department} value={department}>
                        {department}
                      </option>
                    ))}
                  </select>
                </div>
                {hasStructureFilters && (
                  <button
                    onClick={() => setStructureDepartmentFilter("all")}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                      backgroundColor: "transparent",
                      color: "var(--text-muted)",
                      fontSize: "12px",
                      fontWeight: "700",
                    }}
                  >
                    Clear Filter
                  </button>
                )}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                Showing:{" "}
                <strong>
                  {structureDepartmentFilter === "all"
                    ? "All Departments"
                    : structureDepartmentFilter}
                </strong>
              </div>
            </div>

            <div
              className="glass-card"
              style={{ padding: "24px", overflowX: "auto" }}
            >
              {loading ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    padding: "60px",
                  }}
                >
                  <Loader size={32} className="spinner" />
                </div>
              ) : structures.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "60px 20px",
                    color: "var(--text-muted)",
                  }}
                >
                  <IndianRupee
                    size={40}
                    style={{ opacity: 0.3, marginBottom: "12px" }}
                  />
                  <p>No salary structures found. Add one to get started.</p>
                </div>
              ) : filteredStructures.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "60px 20px",
                    color: "var(--text-muted)",
                  }}
                >
                  <AlertCircle
                    size={40}
                    style={{ opacity: 0.3, marginBottom: "12px" }}
                  />
                  <p>No salary structures found for this department.</p>
                </div>
              ) : (
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "separate",
                    borderSpacing: "0 8px",
                  }}
                >
                  <thead>
                    <tr>
                      {[
                        "Employee",
                        "Basic Salary",
                        "HRA",
                        "Allowances",
                        "Deductions",
                        "Gross",
                        "Net Pay",
                      ].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: "0 14px 8px",
                            color: "var(--text-muted)",
                            fontSize: "11px",
                            fontWeight: "700",
                            textAlign: "left",
                            textTransform: "uppercase",
                            letterSpacing: "0.5px",
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStructures.map((s) => {
                      const gross = s.basicSalary + s.hra + s.allowances;
                      const net = gross - s.deductions;
                      return (
                        <tr
                          key={s.id}
                          style={{ backgroundColor: "var(--tag-bg)" }}
                        >
                          <td
                            style={{
                              padding: "14px",
                              borderRadius: "12px 0 0 12px",
                            }}
                          >
                            <div
                              style={{ fontWeight: "600", fontSize: "14px" }}
                            >
                              {s.employee?.name ?? "—"}
                            </div>
                            <div
                              style={{
                                fontSize: "11px",
                                color: "var(--text-muted)",
                              }}
                            >
                              {s.employee?.code} · {s.employee?.department}
                            </div>
                          </td>
                          <td style={{ padding: "14px", fontSize: "13px" }}>
                            {fmtCurrency(s.basicSalary)}
                          </td>
                          <td
                            style={{
                              padding: "14px",
                              fontSize: "13px",
                              color: "var(--text-muted)",
                            }}
                          >
                            {fmtCurrency(s.hra)}
                          </td>
                          <td
                            style={{
                              padding: "14px",
                              fontSize: "13px",
                              color: "var(--text-muted)",
                            }}
                          >
                            {fmtCurrency(s.allowances)}
                          </td>
                          <td
                            style={{
                              padding: "14px",
                              fontSize: "13px",
                              color: "#ef4444",
                            }}
                          >
                            -{fmtCurrency(s.deductions)}
                          </td>
                          <td style={{ padding: "14px", fontSize: "13px" }}>
                            {fmtCurrency(gross)}
                          </td>
                          <td
                            style={{
                              padding: "14px",
                              borderRadius: "0 12px 12px 0",
                              fontWeight: "700",
                              color: "#10b981",
                            }}
                          >
                            {fmtCurrency(net)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>

            {/* Distribution bar */}
            {structures.length > 0 && (
              <div className="glass-card" style={{ padding: "24px" }}>
                <h3 style={{ fontWeight: "700", marginBottom: "16px" }}>
                  Pay Component Breakdown
                </h3>
                {structures.map((s) => {
                  const total = s.basicSalary + s.hra + s.allowances;
                  if (total === 0) return null;
                  return (
                    <div key={s.id} style={{ marginBottom: "16px" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "13px",
                          marginBottom: "8px",
                        }}
                      >
                        <span style={{ fontWeight: "600" }}>
                          {s.employee?.name}
                        </span>
                        <span style={{ color: "var(--text-muted)" }}>
                          Gross {fmtCurrency(total)}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          height: "12px",
                          borderRadius: "6px",
                          overflow: "hidden",
                          gap: "2px",
                        }}
                      >
                        <div
                          style={{
                            width: `${(s.basicSalary / total) * 100}%`,
                            backgroundColor: "var(--primary)",
                          }}
                          title="Basic"
                        />
                        <div
                          style={{
                            width: `${(s.hra / total) * 100}%`,
                            backgroundColor: "#10b981",
                          }}
                          title="HRA"
                        />
                        <div
                          style={{
                            width: `${(s.allowances / total) * 100}%`,
                            backgroundColor: "#f59e0b",
                          }}
                          title="Allowances"
                        />
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: "16px",
                          marginTop: "8px",
                        }}
                      >
                        {[
                          { l: "Basic", v: s.basicSalary, c: "var(--primary)" },
                          { l: "HRA", v: s.hra, c: "#10b981" },
                          { l: "Allowances", v: s.allowances, c: "#f59e0b" },
                        ].map((item) => (
                          <div
                            key={item.l}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "6px",
                            }}
                          >
                            <div
                              style={{
                                width: "8px",
                                height: "8px",
                                borderRadius: "50%",
                                backgroundColor: item.c,
                              }}
                            />
                            <span
                              style={{
                                fontSize: "11px",
                                color: "var(--text-muted)",
                              }}
                            >
                              {item.l}: {fmtCurrency(item.v)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* ── Payslips ──────────────────────────────────────────────────── */}
        {activeTab === "payslips" && (
          <motion.div
            key="payslips"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={{ display: "flex", flexDirection: "column", gap: "24px" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <h2 style={{ fontSize: "24px", fontWeight: "700" }}>
                Payroll Records & Payslips ({filteredRecords.length})
              </h2>
              <button
                onClick={() => {
                  setShowProcessModal(true);
                  setProcessError(null);
                }}
                disabled={structures.length === 0}
                className="btn-primary"
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <Play size={18} /> Process Payroll
              </button>
            </div>

            <div
              style={{ display: "flex", flexDirection: "column", gap: "8px" }}
            >
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                  alignItems: "flex-end",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <label
                    style={{
                      fontSize: "11px",
                      color: "var(--text-muted)",
                      fontWeight: "700",
                      letterSpacing: "0.4px",
                    }}
                  >
                    FILTER STATUS
                  </label>
                  <select
                    value={payslipStatusFilter}
                    onChange={(e) => setPayslipStatusFilter(e.target.value)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "8px",
                      backgroundColor: "var(--input-bg)",
                      border: "1px solid var(--border)",
                      color: "var(--text-main)",
                      fontSize: "13px",
                      minWidth: "160px",
                    }}
                  >
                    <option value="all">All Statuses</option>
                    {["Paid", "Pending", "Failed"].map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <label
                    style={{
                      fontSize: "11px",
                      color: "var(--text-muted)",
                      fontWeight: "700",
                      letterSpacing: "0.4px",
                    }}
                  >
                    FILTER MONTH
                  </label>
                  <select
                    value={payslipMonthFilter}
                    onChange={(e) => setPayslipMonthFilter(e.target.value)}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "8px",
                      backgroundColor: "var(--input-bg)",
                      border: "1px solid var(--border)",
                      color: "var(--text-main)",
                      fontSize: "13px",
                      minWidth: "160px",
                    }}
                  >
                    <option value="all">All Months</option>
                    {MONTHS.map((month, index) => (
                      <option key={month} value={String(index + 1)}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>
                {hasPayslipFilters && (
                  <button
                    onClick={() => {
                      setPayslipStatusFilter("all");
                      setPayslipMonthFilter("all");
                    }}
                    style={{
                      padding: "10px 12px",
                      borderRadius: "8px",
                      border: "1px solid var(--border)",
                      backgroundColor: "transparent",
                      color: "var(--text-muted)",
                      fontSize: "12px",
                      fontWeight: "700",
                    }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>
              <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>
                Showing:{" "}
                <strong>
                  {payslipStatusFilter === "all"
                    ? "All Statuses"
                    : payslipStatusFilter}
                </strong>{" "}
                ·{" "}
                <strong>
                  {payslipMonthFilter === "all"
                    ? "All Months"
                    : MONTHS[Number(payslipMonthFilter) - 1]}
                </strong>
              </div>
            </div>

            <div
              className="glass-card"
              style={{ padding: "24px", overflowX: "auto" }}
            >
              {loading ? (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    padding: "60px",
                  }}
                >
                  <Loader size={32} className="spinner" />
                </div>
              ) : records.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "60px 20px",
                    color: "var(--text-muted)",
                  }}
                >
                  <FileText
                    size={40}
                    style={{ opacity: 0.3, marginBottom: "12px" }}
                  />
                  <p>
                    No payroll records yet. Run "Process Payroll" to generate
                    payslips.
                  </p>
                </div>
              ) : filteredRecords.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "60px 20px",
                    color: "var(--text-muted)",
                  }}
                >
                  <AlertCircle
                    size={40}
                    style={{ opacity: 0.3, marginBottom: "12px" }}
                  />
                  <p>No payroll records match the selected filters.</p>
                </div>
              ) : (
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "separate",
                    borderSpacing: "0 8px",
                  }}
                >
                  <thead>
                    <tr>
                      {["Employee", "Month", "Year", "Net Pay", "Status"].map(
                        (h) => (
                          <th
                            key={h}
                            style={{
                              padding: "0 14px 8px",
                              color: "var(--text-muted)",
                              fontSize: "11px",
                              fontWeight: "700",
                              textAlign: "left",
                              textTransform: "uppercase",
                              letterSpacing: "0.5px",
                            }}
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecords.map((rec) => (
                      <tr
                        key={rec.id}
                        style={{ backgroundColor: "var(--tag-bg)" }}
                      >
                        <td
                          style={{
                            padding: "14px",
                            borderRadius: "12px 0 0 12px",
                          }}
                        >
                          <div style={{ fontWeight: "600", fontSize: "14px" }}>
                            {rec.employee?.name ?? "—"}
                          </div>
                          <div
                            style={{
                              fontSize: "11px",
                              color: "var(--text-muted)",
                            }}
                          >
                            {rec.employee?.code}
                          </div>
                        </td>
                        <td style={{ padding: "14px", fontSize: "13px" }}>
                          {MONTHS[rec.month - 1]}
                        </td>
                        <td
                          style={{
                            padding: "14px",
                            fontSize: "13px",
                            color: "var(--text-muted)",
                          }}
                        >
                          {rec.year}
                        </td>
                        <td
                          style={{
                            padding: "14px",
                            fontWeight: "700",
                            color: "#10b981",
                          }}
                        >
                          {fmtCurrency(rec.netPay)}
                        </td>
                        <td
                          style={{
                            padding: "14px",
                            borderRadius: "0 12px 12px 0",
                          }}
                        >
                          <StatusBadge status={rec.status} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </motion.div>
        )}

        {/* ── Compliance (static info) ─────────────────────────────────── */}
        {activeTab === "compliance" && (
          <motion.div
            key="compliance"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="glass-card" style={{ padding: "24px" }}>
              <h3 style={{ fontWeight: "700", marginBottom: "24px" }}>
                Tax & Statutory Compliance
              </h3>
              <div
                className="responsive-grid-3"
                style={{ display: "grid", gap: "20px" }}
              >
                {[
                  {
                    title: "TDS Management",
                    desc: "Auto-calculated Tax Deducted at Source based on income slabs.",
                    icon: <Scale size={20} />,
                  },
                  {
                    title: "PF / ESI Support",
                    desc: "Provident Fund and Employee State Insurance contributions.",
                    icon: <Building size={20} />,
                  },
                  {
                    title: "Professional Tax",
                    desc: "State-wise Professional Tax (PT) deduction rules.",
                    icon: <PieChart size={20} />,
                  },
                ].map((comp) => (
                  <div
                    key={comp.title}
                    style={{
                      padding: "24px",
                      backgroundColor: "var(--tag-bg)",
                      borderRadius: "12px",
                      border: "1px solid var(--border)",
                    }}
                  >
                    <div
                      style={{
                        padding: "10px",
                        width: "fit-content",
                        backgroundColor: "var(--icon-bg)",
                        borderRadius: "10px",
                        color: "var(--primary)",
                        marginBottom: "16px",
                      }}
                    >
                      {comp.icon}
                    </div>
                    <h4 style={{ fontWeight: "700", marginBottom: "10px" }}>
                      {comp.title}
                    </h4>
                    <p
                      style={{
                        fontSize: "13px",
                        color: "var(--text-muted)",
                        lineHeight: "1.5",
                      }}
                    >
                      {comp.desc}
                    </p>
                  </div>
                ))}
              </div>
              <div
                style={{
                  marginTop: "32px",
                  padding: "24px",
                  backgroundColor: "rgba(245,158,11,0.05)",
                  border: "1px dashed #f59e0b",
                  borderRadius: "12px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    color: "#f59e0b",
                    marginBottom: "10px",
                  }}
                >
                  <AlertCircle size={20} />
                  <h4 style={{ fontWeight: "700" }}>Compliance Reminder</h4>
                </div>
                <p style={{ fontSize: "14px", color: "var(--text-muted)" }}>
                  Ensure all salary structures are finalized before month-end
                  payroll processing to maintain accurate statutory filings.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* ── Reports ──────────────────────────────────────────────────── */}
        {activeTab === "reports" && (
          <motion.div
            key="reports"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="glass-card" style={{ padding: "24px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                  flexWrap: "wrap",
                  marginBottom: "24px",
                }}
              >
                <h3 style={{ fontWeight: "700" }}>
                  Payroll Analytics & Reports
                </h3>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    className="btn-primary"
                    onClick={handleExportCSV}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Download size={16} /> Export CSV
                  </button>
                </div>
              </div>

              {/* Live summary */}
              {!loading && records.length > 0 && (
                <div
                  style={{
                    marginBottom: "24px",
                    padding: "20px",
                    borderRadius: "12px",
                    backgroundColor: "var(--tag-bg)",
                    border: "1px solid var(--border)",
                  }}
                >
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "700",
                      marginBottom: "12px",
                    }}
                  >
                    Live Payroll Summary
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns:
                        "repeat(auto-fit, minmax(160px, 1fr))",
                      gap: "16px",
                    }}
                  >
                    {[
                      { label: "Total Payslips", value: records.length },
                      {
                        label: "Current Month Paid",
                        value: fmtCurrency(stats?.totalNetPayThisMonth ?? 0),
                      },
                      {
                        label: "Employees Paid",
                        value: stats?.processedRecords ?? 0,
                      },
                    ].map((item) => (
                      <div key={item.label}>
                        <div
                          style={{
                            fontSize: "20px",
                            fontWeight: "800",
                            color: "var(--primary)",
                          }}
                        >
                          {item.value}
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: "var(--text-muted)",
                            marginTop: "2px",
                          }}
                        >
                          {item.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {[
                  { name: "Monthly Salary Register", type: "Financial" },
                  { name: "Tax Deduction Summary", type: "Compliance" },
                  { name: "Employee Reimbursement Log", type: "Claims" },
                  { name: "PF Contribution Statement", type: "Statutory" },
                ].map((rep) => (
                  <div
                    key={rep.name}
                    style={{
                      padding: "16px",
                      border: "1px solid var(--border)",
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      gap: "20px",
                    }}
                  >
                    <div
                      style={{
                        width: "40px",
                        height: "40px",
                        borderRadius: "8px",
                        backgroundColor: "var(--input-bg)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "var(--primary)",
                        flexShrink: 0,
                      }}
                    >
                      <FileText size={20} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: "600" }}>{rep.name}</div>
                      <div
                        style={{ fontSize: "11px", color: "var(--text-muted)" }}
                      >
                        {rep.type}
                      </div>
                    </div>
                    <button style={{ color: "var(--text-muted)" }}>
                      <Download size={18} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Add / Update Salary Structure Modal ──────────────────────────── */}
      <AnimatePresence>
        {showStructModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(6px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: "20px",
            }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="glass-card"
              style={{ width: "100%", maxWidth: "480px", padding: "32px" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "24px",
                }}
              >
                <div>
                  <h2 style={{ fontSize: "20px", fontWeight: "800" }}>
                    Salary Structure
                  </h2>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "var(--text-muted)",
                      marginTop: "4px",
                    }}
                  >
                    Set compensation components for an employee.
                  </p>
                </div>
                <button
                  onClick={() => setShowStructModal(false)}
                  style={{ color: "var(--text-muted)", padding: "4px" }}
                >
                  <X size={22} />
                </button>
              </div>

              {structError && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "12px 16px",
                    borderRadius: "10px",
                    backgroundColor: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.25)",
                    color: "#ef4444",
                    fontSize: "13px",
                    marginBottom: "20px",
                  }}
                >
                  <AlertTriangle size={16} />
                  {structError}
                </div>
              )}

              <form
                onSubmit={handleSubmitStructure}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "12px",
                      fontWeight: "600",
                      color: "var(--text-muted)",
                      marginBottom: "8px",
                    }}
                  >
                    Employee *
                  </label>
                  <select
                    required
                    value={structForm.employeeId}
                    onChange={(e) =>
                      setStructForm((p) => ({
                        ...p,
                        employeeId: e.target.value,
                      }))
                    }
                    style={{
                      width: "100%",
                      padding: "12px",
                      borderRadius: "10px",
                      backgroundColor: "var(--input-bg)",
                      border: "1px solid var(--border)",
                      color: "var(--text-main)",
                      fontSize: "14px",
                    }}
                  >
                    <option value="">Select employee…</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name} ({emp.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                  }}
                >
                  {[
                    {
                      label: "Basic Salary *",
                      key: "basicSalary",
                      placeholder: "50000",
                    },
                    { label: "HRA *", key: "hra", placeholder: "15000" },
                    {
                      label: "Allowances",
                      key: "allowances",
                      placeholder: "5000",
                    },
                    {
                      label: "Deductions",
                      key: "deductions",
                      placeholder: "2000",
                    },
                  ].map((field) => (
                    <div key={field.key}>
                      <label
                        style={{
                          display: "block",
                          fontSize: "12px",
                          fontWeight: "600",
                          color: "var(--text-muted)",
                          marginBottom: "8px",
                        }}
                      >
                        {field.label}
                      </label>
                      <div style={{ position: "relative" }}>
                        <IndianRupee
                          size={14}
                          style={{
                            position: "absolute",
                            left: "12px",
                            top: "50%",
                            transform: "translateY(-50%)",
                            color: "var(--text-muted)",
                          }}
                        />
                        <input
                          required={field.label.includes("*")}
                          type="number"
                          min="0"
                          step="1"
                          value={structForm[field.key]}
                          onChange={(e) =>
                            setStructForm((p) => ({
                              ...p,
                              [field.key]: e.target.value,
                            }))
                          }
                          placeholder={field.placeholder}
                          style={{
                            width: "100%",
                            padding: "12px 12px 12px 32px",
                            borderRadius: "10px",
                            backgroundColor: "var(--input-bg)",
                            border: "1px solid var(--border)",
                            color: "var(--text-main)",
                            fontSize: "14px",
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Preview */}
                {structForm.basicSalary && (
                  <div
                    style={{
                      padding: "14px",
                      borderRadius: "10px",
                      backgroundColor: "var(--tag-bg)",
                      border: "1px solid var(--border)",
                      fontSize: "13px",
                    }}
                  >
                    <div style={{ fontWeight: "700", marginBottom: "8px" }}>
                      Preview
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <span style={{ color: "var(--text-muted)" }}>Gross</span>
                      <span style={{ fontWeight: "600" }}>
                        {fmtCurrency(
                          (+structForm.basicSalary || 0) +
                            (+structForm.hra || 0) +
                            (+structForm.allowances || 0),
                        )}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: "4px",
                      }}
                    >
                      <span style={{ color: "var(--text-muted)" }}>
                        Deductions
                      </span>
                      <span style={{ color: "#ef4444" }}>
                        -{fmtCurrency(+structForm.deductions || 0)}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        marginTop: "8px",
                        paddingTop: "8px",
                        borderTop: "1px solid var(--border)",
                      }}
                    >
                      <span style={{ fontWeight: "700" }}>Net Pay</span>
                      <span style={{ fontWeight: "800", color: "#10b981" }}>
                        {fmtCurrency(
                          (+structForm.basicSalary || 0) +
                            (+structForm.hra || 0) +
                            (+structForm.allowances || 0) -
                            (+structForm.deductions || 0),
                        )}
                      </span>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitStruct}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    padding: "14px",
                    fontSize: "15px",
                    fontWeight: "700",
                    marginTop: "4px",
                  }}
                >
                  {submitStruct ? (
                    <>
                      <Loader size={20} className="spinner" /> Saving…
                    </>
                  ) : (
                    <>
                      <Hash size={18} /> Save Structure
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Process Payroll Modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {showProcessModal && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(6px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: "20px",
            }}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="glass-card"
              style={{ width: "100%", maxWidth: "400px", padding: "32px" }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "24px",
                }}
              >
                <div>
                  <h2 style={{ fontSize: "20px", fontWeight: "800" }}>
                    Process Payroll
                  </h2>
                  <p
                    style={{
                      fontSize: "13px",
                      color: "var(--text-muted)",
                      marginTop: "4px",
                    }}
                  >
                    This will generate net-pay records for all{" "}
                    {structures.length} employee
                    {structures.length !== 1 ? "s" : ""} with a salary
                    structure.
                  </p>
                </div>
                <button
                  onClick={() => setShowProcessModal(false)}
                  style={{ color: "var(--text-muted)", padding: "4px" }}
                >
                  <X size={22} />
                </button>
              </div>

              {processError && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "12px 16px",
                    borderRadius: "10px",
                    backgroundColor: "rgba(239,68,68,0.08)",
                    border: "1px solid rgba(239,68,68,0.25)",
                    color: "#ef4444",
                    fontSize: "13px",
                    marginBottom: "20px",
                  }}
                >
                  <AlertTriangle size={16} />
                  {processError}
                </div>
              )}

              <form
                onSubmit={handleProcessPayroll}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "12px",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "var(--text-muted)",
                        marginBottom: "8px",
                      }}
                    >
                      Month *
                    </label>
                    <select
                      value={processForm.month}
                      onChange={(e) =>
                        setProcessForm((p) => ({ ...p, month: e.target.value }))
                      }
                      style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "10px",
                        backgroundColor: "var(--input-bg)",
                        border: "1px solid var(--border)",
                        color: "var(--text-main)",
                        fontSize: "14px",
                      }}
                    >
                      {MONTHS.map((m, i) => (
                        <option key={m} value={i + 1}>
                          {m}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "12px",
                        fontWeight: "600",
                        color: "var(--text-muted)",
                        marginBottom: "8px",
                      }}
                    >
                      Year *
                    </label>
                    <input
                      type="number"
                      min="2024"
                      max="2030"
                      value={processForm.year}
                      onChange={(e) =>
                        setProcessForm((p) => ({ ...p, year: e.target.value }))
                      }
                      style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "10px",
                        backgroundColor: "var(--input-bg)",
                        border: "1px solid var(--border)",
                        color: "var(--text-main)",
                        fontSize: "14px",
                      }}
                    />
                  </div>
                </div>

                <div
                  style={{
                    padding: "14px",
                    borderRadius: "10px",
                    backgroundColor: "rgba(245,158,11,0.06)",
                    border: "1px solid rgba(245,158,11,0.2)",
                    fontSize: "13px",
                    color: "var(--text-muted)",
                  }}
                >
                  ⚠️ Running payroll for{" "}
                  <strong>
                    {MONTHS[+processForm.month - 1]} {processForm.year}
                  </strong>{" "}
                  will mark all records as <strong>Paid</strong>. Existing
                  records for this period will be updated.
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={processingPayroll}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "10px",
                    padding: "14px",
                    fontSize: "15px",
                    fontWeight: "700",
                  }}
                >
                  {processingPayroll ? (
                    <>
                      <Loader size={20} className="spinner" /> Processing…
                    </>
                  ) : (
                    <>
                      <Play size={18} /> Run Payroll
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Payroll;
