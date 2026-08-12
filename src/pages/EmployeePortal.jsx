import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  BookOpen,
  X,
  ChevronRight,
  Loader,
  Clock3,
  Wallet2,
  UserCircle2,
  CalendarDays,
  ShieldAlert,
  CheckCircle2,
  TrendingUp,
  ArrowDownCircle,
  PlusCircle,
  ArrowRight,
  ShieldCheck,
  Calendar,
  Layers,
  Award,
  ReceiptText,
  UserMinus,
  Download,
  Wallet,
  Eye,
  Clock,
  CheckCircle,
} from "lucide-react";
import { toast } from "sonner";
import apiClient from "../api/apiClient";
import Skeleton from "../components/common/Skeleton";

const LiveClock = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--primary)" }}>
      {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  );
};

const EmployeePortalSkeleton = () => (
  <div style={{ animation: "fadeIn 0.5s ease" }}>
    <header style={{ marginBottom: "32px" }}>
      <Skeleton height="32px" width="280px" style={{ marginBottom: "8px" }} />
      <Skeleton height="20px" width="100%" maxWidth="450px" />
    </header>

    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "24px", marginBottom: "40px" }}>
      <div className="glass-card" style={{ padding: "24px", display: "flex", alignItems: "center", gap: "20px" }}>
        <Skeleton circle height="80px" />
        <div style={{ flex: 1 }}>
          <Skeleton height="24px" width="150px" style={{ marginBottom: "8px" }} />
          <Skeleton height="16px" width="100px" />
        </div>
      </div>
      <div className="glass-card" style={{ padding: "24px", display: "flex", justifyContent: "space-around" }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ textAlign: "center" }}>
            <Skeleton height="24px" width="40px" style={{ marginBottom: "8px", margin: "0 auto 8px" }} />
            <Skeleton height="14px" width="60px" />
          </div>
        ))}
      </div>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr)", gap: "24px" }}>
      <div className="glass-card" style={{ padding: "24px" }}>
        <Skeleton height="24px" width="180px" style={{ marginBottom: "20px" }} />
        <div style={{ display: "grid", gap: "16px" }}>
          <Skeleton height="45px" />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <Skeleton height="45px" />
            <Skeleton height="45px" />
          </div>
          <Skeleton height="100px" />
          <Skeleton height="45px" />
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        <div className="glass-card" style={{ padding: "24px" }}>
          <Skeleton height="24px" width="200px" style={{ marginBottom: "20px" }} />
          <div style={{ display: "grid", gap: "12px" }}>
            {[1, 2, 3].map((i) => (
              <div key={i} style={{ padding: "16px", border: "1px solid var(--border)", borderRadius: "12px" }}>
                <Skeleton height="18px" width="120px" style={{ marginBottom: "8px" }} />
                <Skeleton height="14px" width="100%" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  </div>
);

const initialLeaveForm = {
  type: "Annual",
  startDate: "",
  endDate: "",
  reason: "",
};
const initialComplaintForm = {
  subject: "",
  category: "General",
  description: "",
  severity: "Medium",
};
const initialReimbursementForm = {
  amount: "",
  reason: "",
  date: "",
  attachmentUrl: "",
};
const initialResignationForm = {
  proposedLastWorkingDay: "",
  reason: "",
  handoverPlan: "",
};

const toCurrency = (value) =>
  value === null || value === undefined
    ? "-"
    : Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 });

const getStatusStyle = (status) => {
  const s = status?.toLowerCase();
  if (s === "approved" || s === "resolved" || s === "completed") {
    return { backgroundColor: "rgba(34, 197, 94, 0.1)", color: "#22c55e" };
  }
  if (s === "rejected" || s === "escalated" || s === "cancelled") {
    return { backgroundColor: "rgba(239, 68, 68, 0.1)", color: "#ef4444" };
  }
  if (s === "pending" || s === "in review") {
    return { backgroundColor: "rgba(234, 179, 8, 0.1)", color: "#eab308" };
  }
  return { backgroundColor: "var(--tag-bg)", color: "var(--text-muted)" };
};

const inputStyle = {
  padding: "10px 12px",
  backgroundColor: "var(--input-bg)",
  color: "var(--text-main)",
  border: "1px solid var(--border)",
  width: "100%",
};

const EmployeePortal = () => {
  const { user } = useSelector((state) => state.auth);

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [employeeId, setEmployeeId] = useState(null);

  const [employee, setEmployee] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [salaryStructure, setSalaryStructure] = useState(null);
  const [payrollRecords, setPayrollRecords] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [viewingPolicy, setViewingPolicy] = useState(null);
  const [viewingResignation, setViewingResignation] = useState(false);

  const [leaveForm, setLeaveForm] = useState(initialLeaveForm);
  const [complaintForm, setComplaintForm] = useState(initialComplaintForm);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [leaveStatusFilter, setLeaveStatusFilter] = useState("All");
  const [complaintStatusFilter, setComplaintStatusFilter] = useState("All");

  const [reimbursementForm, setReimbursementForm] = useState(initialReimbursementForm);
  const [resignationForm, setResignationForm] = useState(initialResignationForm);
  const [receiptFile, setReceiptFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [myReimbursements, setMyReimbursements] = useState([]);
  const [myResignation, setMyResignation] = useState(null);

  useEffect(() => {
    if (!receiptFile) {
      setPreviewUrl(null);
      return;
    }

    if (receiptFile.type.startsWith('image/')) {
      const url = URL.createObjectURL(receiptFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setPreviewUrl(null);
    }
  }, [receiptFile]);

  const todayIsoDate = useMemo(() => {
    const now = new Date();
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
    return local.toISOString().slice(0, 10);
  }, []);

  const fetchEmployeeData = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const myEmployeeRes = await apiClient.get("/leaves/my-employee-id");
      const myEmployeeId = myEmployeeRes.data?.employeeId || null;
      setEmployeeId(myEmployeeId);

      if (!myEmployeeId) {
        setEmployee(null);
        setTodayAttendance(null);
        setSalaryStructure(null);
        setPayrollRecords([]);
        setLeaveRequests([]);
        setComplaints([]);

        return;
      }

      const [
        employeesRes,
        attendanceRes,
        salaryRes,
        payrollRes,
        leaveRes,
        grievanceRes,
        policiesRes,
        reimbursementRes,
        resignationRes,
      ] = await Promise.all([
        apiClient.get("/employees"),
        apiClient.get(`/attendance?date=${todayIsoDate}`),
        apiClient.get("/payroll/structures"),
        apiClient.get("/payroll/records"),
        apiClient.get("/leaves"),
        apiClient.get("/grievances"),
        apiClient.get("/policies"),
        apiClient.get("/finance/reimbursements"),
        apiClient.get("/hr-resignations"),
      ]);

      const employeeRecord =
        employeesRes.data.find((item) => item.id === myEmployeeId) || null;
      const attendanceRecord =
        attendanceRes.data.find((item) => item.employeeId === myEmployeeId) ||
        null;
      const salaryRecord =
        salaryRes.data.find((item) => item.employeeId === myEmployeeId) || null;
      const payrollHistory = payrollRes.data.filter(
        (item) => item.employeeId === myEmployeeId,
      );
      const myLeaves = leaveRes.data.filter(
        (item) => item.employeeId === myEmployeeId,
      );
      const myComplaints = grievanceRes.data.filter(
        (item) => item.employeeId === myEmployeeId,
      );
      const myClaims = reimbursementRes.data.filter(
        (item) => item.employeeId === myEmployeeId,
      );
      const myExit = resignationRes.data.find(
        (item) => item.employeeId === myEmployeeId,
      );

      setEmployee(employeeRecord);
      setTodayAttendance(attendanceRecord);
      setSalaryStructure(salaryRecord);
      setPayrollRecords(payrollHistory);
      setLeaveRequests(myLeaves);
      setComplaints(myComplaints);
      setPolicies(policiesRes.data);
      setMyReimbursements(myClaims);
      setMyResignation(myExit);
    } catch (fetchError) {
      const message =
        fetchError.response?.data?.message ||
        "Failed to load employee portal data";
      setError(message);
      toast.error(
        Array.isArray(message) ? message.join(", ") : String(message),
      );
    } finally {
      setLoading(false);
    }
  }, [todayIsoDate]);

  useEffect(() => {
    fetchEmployeeData();
  }, [fetchEmployeeData]);

  const handleCheckIn = async () => {
    if (!employeeId) return;

    setActionLoading("checkin");
    setError("");
    setSuccessMessage("");

    try {
      await apiClient.post("/attendance", {
        employeeId,
        date: todayIsoDate,
        status: "Present",
        checkIn: new Date().toISOString(),
      });
      setSuccessMessage("Check-in recorded successfully.");
      toast.success("Check-in recorded successfully");
      await fetchEmployeeData();
    } catch (checkInError) {
      const message = checkInError.response?.data?.message || "Check-in failed";
      setError(message);
      toast.error(
        Array.isArray(message) ? message.join(", ") : String(message),
      );
    } finally {
      setActionLoading("");
    }
  };

  const handleLeaveSubmit = async (event) => {
    event.preventDefault();
    if (!employeeId) return;

    if (!leaveForm.startDate || !leaveForm.endDate) {
      setError("Please select both start and end date for leave.");
      toast.error("Please select both start and end date for leave");
      return;
    }

    if (new Date(leaveForm.endDate) < new Date(leaveForm.startDate)) {
      setError("Leave end date cannot be before start date.");
      toast.error("Leave end date cannot be before start date");
      return;
    }

    setActionLoading("leave");
    setError("");
    setSuccessMessage("");

    try {
      await apiClient.post("/leaves", {
        ...leaveForm,
        employeeId,
        reason: leaveForm.reason.trim(),
        startDate: new Date(leaveForm.startDate).toISOString(),
        endDate: new Date(leaveForm.endDate).toISOString(),
      });
      setLeaveForm(initialLeaveForm);
      setSuccessMessage("Leave request submitted.");
      toast.success("Leave request submitted");
      await fetchEmployeeData();
    } catch (leaveError) {
      const message =
        leaveError.response?.data?.message || "Leave request failed";
      setError(message);
      toast.error(
        Array.isArray(message) ? message.join(", ") : String(message),
      );
    } finally {
      setActionLoading("");
    }
  };

  const handleComplaintSubmit = async (event) => {
    event.preventDefault();
    if (!employeeId) return;

    if (!complaintForm.subject.trim() || !complaintForm.description.trim()) {
      setError("Subject and complaint description are required.");
      toast.error("Subject and complaint description are required");
      return;
    }

    setActionLoading("complaint");
    setError("");
    setSuccessMessage("");

    try {
      await apiClient.post("/grievances", {
        ...complaintForm,
        subject: complaintForm.subject.trim(),
        category: complaintForm.category.trim(),
        description: complaintForm.description.trim(),
        employeeId,
      });
      setComplaintForm(initialComplaintForm);
      setSuccessMessage("Complaint submitted successfully.");
      toast.success("Complaint submitted successfully");
      await fetchEmployeeData();
    } catch (complaintError) {
      const message =
        complaintError.response?.data?.message || "Complaint submission failed";
      setError(message);
      toast.error(
        Array.isArray(message) ? message.join(", ") : String(message),
      );
    } finally {
      setActionLoading("");
    }
  };

  const handleReimbursementSubmit = async (event) => {
    event.preventDefault();
    if (!employeeId) return;

    if (!reimbursementForm.amount || !reimbursementForm.reason.trim()) {
      setError("Amount and reason are required.");
      toast.error("Amount and reason are required");
      return;
    }

    setActionLoading("reimbursement");
    setError("");
    setSuccessMessage("");

    try {
      let finalAttachmentUrl = reimbursementForm.attachmentUrl;

      // Handle file upload if a file is selected
      if (receiptFile) {
        const uploadFormData = new FormData();
        uploadFormData.append("file", receiptFile);
        const uploadRes = await apiClient.post("/upload", uploadFormData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        finalAttachmentUrl = uploadRes.data.url;
      }

      let formattedDate = undefined;
      if (reimbursementForm.date) {
        const d = new Date(reimbursementForm.date);
        if (!isNaN(d.getTime())) {
          formattedDate = d.toISOString();
        }
      }

      await apiClient.post("/finance/reimbursements", {
        ...reimbursementForm,
        amount: parseFloat(reimbursementForm.amount),
        date: formattedDate,
        attachmentUrl: finalAttachmentUrl,
        employeeId,
      });
      setReimbursementForm(initialReimbursementForm);
      setReceiptFile(null);
      setSuccessMessage("Reimbursement request submitted.");
      toast.success("Reimbursement request submitted");
      await fetchEmployeeData();
    } catch (err) {
      const message = err.response?.data?.message || "Submission failed";
      setError(message);
      toast.error(Array.isArray(message) ? message.join(", ") : String(message));
    } finally {
      setActionLoading("");
    }
  };

  const handleResignationSubmit = async (event) => {
    event.preventDefault();
    if (!employeeId) return;

    if (!resignationForm.proposedLastWorkingDay || !resignationForm.reason.trim()) {
      setError("Last working day and reason are required.");
      toast.error("Last working day and reason are required");
      return;
    }

    setActionLoading("resignation");
    setError("");
    setSuccessMessage("");

    try {
      await apiClient.post("/hr-resignations", {
        ...resignationForm,
        employeeId,
      });
      setResignationForm(initialResignationForm);
      setSuccessMessage("Resignation submitted successfully.");
      toast.success("Resignation submitted successfully");
      await fetchEmployeeData();
    } catch (err) {
      const message = err.response?.data?.message || "Resignation failed";
      setError(message);
      toast.error(Array.isArray(message) ? message.join(", ") : String(message));
    } finally {
      setActionLoading("");
    }
  };

  const latestPayroll = payrollRecords[0] || null;
  const canCheckIn = !todayAttendance?.checkIn;

  const leaveSubmitDisabled =
    actionLoading === "leave" || !leaveForm.startDate || !leaveForm.endDate;
  const complaintSubmitDisabled =
    actionLoading === "complaint" ||
    !complaintForm.subject.trim() ||
    !complaintForm.description.trim();
  const filteredLeaveRequests = leaveRequests.filter(
    (leave) =>
      leaveStatusFilter === "All" || leave.status === leaveStatusFilter,
  );
  const filteredComplaints = complaints.filter(
    (complaint) =>
      complaintStatusFilter === "All" ||
      complaint.status === complaintStatusFilter,
  );

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);

  if (loading) {
    return <EmployeePortalSkeleton />;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="employee-portal"
      style={{
        width: "100%",
        maxWidth: "1300px",
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
        paddingBottom: "40px",
      }}
    >
      {/* Header Section */}
      <div 
        className="glass-card" 
        style={{ 
          padding: "32px", 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          background: "linear-gradient(to right, var(--bg-card), rgba(14, 165, 233, 0.03))",
          overflow: "hidden",
          position: "relative"
        }}
      >
        <div style={{ position: "relative", zIndex: 1 }}>
          <h1 style={{ fontSize: "32px", fontWeight: "900", marginBottom: "8px", letterSpacing: "-0.5px" }}>
            {greeting}, {user?.fullName?.split(" ")[0] || "Employee"}! 👋
          </h1>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "var(--text-muted)" }}>
            <Calendar size={14} />
            <span style={{ fontSize: "14px", fontWeight: "500" }}>
              {new Date().toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <div style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: "var(--border)" }} />
            <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--text-main)" }}>
              Twenty CRM Official Portal
            </span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "flex-end", marginBottom: "4px" }}>
            <div className="status-pulse" />
            <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)" }}>LIVE FEED ACTIVE</span>
          </div>
          <LiveClock />
        </div>
      </div>

      {error && (
        <div
          className="glass-card"
          style={{
            padding: "14px 16px",
            color: "var(--text-main)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <AlertCircle size={16} />
          {Array.isArray(error) ? error.join(", ") : String(error)}
        </div>
      )}

      {successMessage && (
        <div
          className="glass-card"
          style={{
            padding: "14px 16px",
            color: "var(--text-main)",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <CheckCircle2 size={16} />
          {successMessage}
        </div>
      )}

      {!employeeId ? (
        <div
          className="glass-card"
          style={{ padding: "20px", color: "var(--text-muted)" }}
        >
          Your account is not linked to an employee record yet. Contact
          HR/Admin.
        </div>
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "20px",
            }}
          >
            {/* Quick Check-In Card */}
            <div className="glass-card" style={{ padding: "24px", position: "relative" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ padding: "10px", borderRadius: "12px", background: "rgba(14, 165, 233, 0.1)", color: "var(--primary)" }}>
                    <Clock3 size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontWeight: "800", fontSize: "16px" }}>Attendance</h3>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Daily Check-in</p>
                  </div>
                </div>
                {todayAttendance && (
                  <div className="premium-badge premium-badge-blue">PRESENT</div>
                )}
              </div>
              
              <div style={{ marginBottom: "24px" }}>
                <p style={{ fontSize: "13px", color: "var(--text-muted)", marginBottom: "4px" }}>Check-in Status</p>
                <h4 style={{ fontSize: "20px", fontWeight: "800" }}>
                  {todayAttendance?.checkIn
                    ? new Date(todayAttendance.checkIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : "Not Started"}
                </h4>
              </div>

              <button
                className="btn-primary"
                onClick={handleCheckIn}
                disabled={!canCheckIn || actionLoading === "checkin"}
                style={{ 
                  width: "100%", 
                  padding: "14px", 
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "10px",
                  fontWeight: "700"
                }}
              >
                {actionLoading === "checkin" ? (
                  <Loader size={18} className="spinner" />
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    {canCheckIn ? "Check In Now" : "Currently Present"}
                  </>
                )}
              </button>
            </div>

            {/* Premium Salary Card */}
            <div className="glass-card salary-card-net" style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px", position: "relative", zIndex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ padding: "10px", borderRadius: "12px", background: "rgba(14, 165, 233, 0.15)", color: "var(--primary)" }}>
                    <Wallet2 size={24} />
                  </div>
                  <div>
                    <h3 style={{ fontWeight: "800", fontSize: "16px" }}>Salary Summary</h3>
                    <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>Latest Payout</p>
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: "11px", fontWeight: "700", color: "var(--primary)", textTransform: "uppercase" }}>Monthly Net</p>
                  <h4 style={{ fontSize: "22px", fontWeight: "900", color: "var(--text-main)" }}>
                    ${latestPayroll ? toCurrency(latestPayroll.netPay) : toCurrency(salaryStructure?.basicSalary) || "0"}
                  </h4>
                </div>
              </div>

              <div style={{ display: "grid", gap: "12px", position: "relative", zIndex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
                    <PlusCircle size={14} color="#10b981" /> Basic Salary
                  </span>
                  <span style={{ fontWeight: "700" }}>{salaryStructure ? toCurrency(salaryStructure.basicSalary) : "-"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
                    <TrendingUp size={14} color="#38bdf8" /> Allowances
                  </span>
                  <span style={{ fontWeight: "700" }}>{salaryStructure ? toCurrency(salaryStructure.allowances) : "-"}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span style={{ color: "var(--text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
                    <ArrowDownCircle size={14} color="#ef4444" /> Deductions
                  </span>
                  <span style={{ fontWeight: "700", color: "#ef4444" }}>-{salaryStructure ? toCurrency(salaryStructure.deductions) : "-"}</span>
                </div>
                <div style={{ marginTop: "8px", paddingTop: "12px", borderTop: "1px dashed var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                   <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)" }}>PAY SLIP</span>
                   <button style={{ fontSize: "12px", fontWeight: "700", color: "var(--primary)", display: "flex", alignItems: "center", gap: "4px" }}>
                     View History <ChevronRight size={14} />
                   </button>
                </div>
              </div>
            </div>

            {/* Profile Detail Card */}
            <div className="glass-card" style={{ padding: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "24px" }}>
                <div 
                  style={{ 
                    width: "60px", 
                    height: "60px", 
                    borderRadius: "16px", 
                    background: "linear-gradient(135deg, var(--primary), #38bdf8)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "24px",
                    fontWeight: "900",
                    color: "white",
                    boxShadow: "0 10px 15px -3px rgba(14, 165, 233, 0.4)"
                  }}
                >
                  {user?.fullName?.[0] || "U"}
                </div>
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: "800" }}>{user?.fullName || "Welcome!" }</h3>
                  <div style={{ display: "flex", gap: "6px", marginTop: "4px" }}>
                    <div className="premium-badge premium-badge-blue">{employee?.department || "General"}</div>
                    <div className="premium-badge" style={{ background: "rgba(255,255,255,0.05)" }}>{employee?.role || "Team Member"}</div>
                  </div>
                </div>
              </div>

              <div style={{ display: "grid", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
                  <ShieldCheck size={16} color="var(--text-muted)" />
                  <span style={{ color: "var(--text-muted)" }}>Emp ID:</span>
                  <span style={{ fontWeight: "700" }}>{employee?.id?.slice(-6).toUpperCase() || "N/A"}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
                  <Award size={16} color="var(--text-muted)" />
                  <span style={{ color: "var(--text-muted)" }}>Status:</span>
                  <span style={{ fontWeight: "700", color: "#10b981" }}>Active</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "13px" }}>
                  <Layers size={16} color="var(--text-muted)" />
                  <span style={{ color: "var(--text-muted)" }}>Level:</span>
                  <span style={{ fontWeight: "700" }}>Standard</span>
                </div>
              </div>
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "14px",
            }}
          >
            <div className="glass-card" style={{ padding: "18px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "14px",
                }}
              >
                <CalendarDays size={18} />
                <h3 style={{ fontWeight: "700" }}>Apply Leave</h3>
              </div>

              <form
                onSubmit={handleLeaveSubmit}
                style={{ display: "grid", gap: "16px" }}
              >
                <div className="form-group-modern">
                  <label>Leave Type</label>
                  <select
                    value={leaveForm.type}
                    onChange={(event) =>
                      setLeaveForm((prev) => ({
                        ...prev,
                        type: event.target.value,
                      }))
                    }
                    className="glass-card"
                    style={{ ...inputStyle, borderRadius: "10px" }}
                  >
                    {[
                      "Annual",
                      "Sick",
                      "Casual",
                      "Maternity",
                      "Paternity",
                      "Unpaid",
                    ].map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="form-group-modern">
                    <label>Start Date</label>
                    <input
                      type="date"
                      required
                      value={leaveForm.startDate}
                      onChange={(event) =>
                        setLeaveForm((prev) => ({
                          ...prev,
                          startDate: event.target.value,
                        }))
                      }
                      className="glass-card"
                      style={{ ...inputStyle, borderRadius: "10px" }}
                    />
                  </div>
                  <div className="form-group-modern">
                    <label>End Date</label>
                    <input
                      type="date"
                      required
                      value={leaveForm.endDate}
                      onChange={(event) =>
                        setLeaveForm((prev) => ({
                          ...prev,
                          endDate: event.target.value,
                        }))
                      }
                      className="glass-card"
                      style={{ ...inputStyle, borderRadius: "10px" }}
                    />
                  </div>
                </div>

                <div className="form-group-modern">
                  <label>Reason for Leave</label>
                  <textarea
                    rows={3}
                    placeholder="Provide a brief explanation..."
                    value={leaveForm.reason}
                    onChange={(event) =>
                      setLeaveForm((prev) => ({
                        ...prev,
                        reason: event.target.value,
                      }))
                    }
                    className="glass-card"
                    style={{ ...inputStyle, resize: "vertical", borderRadius: "10px" }}
                  />
                </div>

                <button 
                  className="btn-primary" 
                  disabled={leaveSubmitDisabled}
                  style={{ padding: "14px", borderRadius: "10px", fontWeight: "700" }}
                >
                  {actionLoading === "leave"
                    ? "Submitting Request..."
                    : "Finalize Leave Request"}
                </button>
              </form>

              <div
                style={{
                  marginTop: "12px",
                  fontSize: "13px",
                  color: "var(--text-muted)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                <span>
                  My leave requests: {filteredLeaveRequests.length} /{" "}
                  {leaveRequests.length}
                </span>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: "700",
                      letterSpacing: "0.4px",
                    }}
                  >
                    FILTER LEAVE STATUS
                  </span>
                  <select
                    value={leaveStatusFilter}
                    onChange={(event) =>
                      setLeaveStatusFilter(event.target.value)
                    }
                    style={{
                      padding: "6px 8px",
                      borderRadius: "8px",
                      backgroundColor: "var(--input-bg)",
                      border: "1px solid var(--border)",
                      color: "var(--text-main)",
                      fontSize: "12px",
                    }}
                  >
                    <option value="All">All Statuses</option>
                    <option value="Pending">Pending Only</option>
                    <option value="Approved">Approved Only</option>
                    <option value="Rejected">Rejected Only</option>
                  </select>
                </div>
              </div>

              <div
                style={{
                  marginTop: "10px",
                  display: "grid",
                  gap: "8px",
                  maxHeight: "180px",
                  overflowY: "auto",
                }}
              >
                {filteredLeaveRequests.slice(0, 6).map((leave) => (
                  <div
                    key={leave.id}
                    style={{
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      padding: "10px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: "13px", fontWeight: "600" }}>
                        {leave.type}
                      </div>
                      <div
                        style={{ fontSize: "12px", color: "var(--text-muted)" }}
                      >
                        {new Date(leave.startDate).toLocaleDateString()} -{" "}
                        {new Date(leave.endDate).toLocaleDateString()}
                      </div>
                    </div>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: "999px",
                        fontSize: "11px",
                        fontWeight: "600",
                        ...getStatusStyle(leave.status),
                      }}
                    >
                      {leave.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card" style={{ padding: "18px" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "14px",
                }}
              >
                <ShieldAlert size={18} />
                <h3 style={{ fontWeight: "700" }}>Post Complaint</h3>
              </div>

              <form
                onSubmit={handleComplaintSubmit}
                style={{ display: "grid", gap: "16px" }}
              >
                <div className="form-group-modern">
                  <label>Subject</label>
                  <input
                    type="text"
                    required
                    placeholder="Brief title of your complaint"
                    value={complaintForm.subject}
                    onChange={(event) =>
                      setComplaintForm((prev) => ({
                        ...prev,
                        subject: event.target.value,
                      }))
                    }
                    className="glass-card"
                    style={{ ...inputStyle, borderRadius: "10px" }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div className="form-group-modern">
                    <label>Category</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Workplace, Tech"
                      value={complaintForm.category}
                      onChange={(event) =>
                        setComplaintForm((prev) => ({
                          ...prev,
                          category: event.target.value,
                        }))
                      }
                      className="glass-card"
                      style={{ ...inputStyle, borderRadius: "10px" }}
                    />
                  </div>
                  <div className="form-group-modern">
                    <label>Severity</label>
                    <select
                      value={complaintForm.severity}
                      onChange={(event) =>
                        setComplaintForm((prev) => ({
                          ...prev,
                          severity: event.target.value,
                        }))
                      }
                      className="glass-card"
                      style={{ ...inputStyle, borderRadius: "10px" }}
                    >
                      {["Low", "Medium", "High", "Critical"].map((severity) => (
                        <option key={severity} value={severity}>
                          {severity}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group-modern">
                  <label>Detailed Description</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Please describe the issue in detail..."
                    value={complaintForm.description}
                    onChange={(event) =>
                      setComplaintForm((prev) => ({
                        ...prev,
                        description: event.target.value,
                      }))
                    }
                    className="glass-card"
                    style={{ ...inputStyle, resize: "vertical", borderRadius: "10px" }}
                  />
                </div>

                <button 
                  className="btn-primary" 
                  disabled={complaintSubmitDisabled}
                  style={{ padding: "14px", borderRadius: "10px", fontWeight: "700" }}
                >
                  {actionLoading === "complaint"
                    ? "Posting Complaint..."
                    : "Submit Official Complaint"}
                </button>
              </form>

              <div
                style={{
                  marginTop: "12px",
                  fontSize: "13px",
                  color: "var(--text-muted)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                <span>
                  My complaints: {filteredComplaints.length} /{" "}
                  {complaints.length}
                </span>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  <span
                    style={{
                      fontSize: "11px",
                      fontWeight: "700",
                      letterSpacing: "0.4px",
                    }}
                  >
                    FILTER COMPLAINT STATUS
                  </span>
                  <select
                    value={complaintStatusFilter}
                    onChange={(event) =>
                      setComplaintStatusFilter(event.target.value)
                    }
                    style={{
                      padding: "6px 8px",
                      borderRadius: "8px",
                      backgroundColor: "var(--input-bg)",
                      border: "1px solid var(--border)",
                      color: "var(--text-main)",
                      fontSize: "12px",
                    }}
                  >
                    <option value="All">All Statuses</option>
                    <option value="Open">Open Only</option>
                    <option value="In Review">In Review Only</option>
                    <option value="Escalated">Escalated Only</option>
                    <option value="Resolved">Resolved Only</option>
                  </select>
                </div>
              </div>

              <div
                style={{
                  marginTop: "10px",
                  display: "grid",
                  gap: "8px",
                  maxHeight: "180px",
                  overflowY: "auto",
                }}
              >
                {filteredComplaints.slice(0, 6).map((complaint) => (
                  <div
                    key={complaint.id}
                    style={{
                      border: "1px solid var(--border)",
                      borderRadius: "8px",
                      padding: "10px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: "13px",
                          fontWeight: "600",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          maxWidth: "220px",
                        }}
                      >
                        {complaint.subject}
                      </div>
                      <div
                        style={{ fontSize: "12px", color: "var(--text-muted)" }}
                      >
                        {new Date(complaint.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <span
                      style={{
                        padding: "4px 8px",
                        borderRadius: "999px",
                        fontSize: "11px",
                        fontWeight: "600",
                        ...getStatusStyle(complaint.status),
                      }}
                    >
                      {complaint.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <section style={{ marginTop: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              <BookOpen size={22} color="var(--primary)" />
              <h2 style={{ fontSize: "20px", fontWeight: "800" }}>Office Policies & Guidelines</h2>
            </div>
            
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
                gap: "20px",
              }}
            >
              {policies.length === 0 ? (
                <div className="glass-card" style={{ padding: "24px", textAlign: "center", color: "var(--text-muted)", gridColumn: "1/-1" }}>
                  No office policies have been published yet.
                </div>
              ) : (
                policies.map((policy) => (
                  <motion.div
                    key={policy.id}
                    whileHover={{ y: -5 }}
                    className="glass-card"
                    style={{
                      padding: "24px",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      gap: "16px",
                      border: "1px solid var(--border)",
                      transition: "all 0.2s ease"
                    }}
                    onClick={() => setViewingPolicy(policy)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div style={{ padding: "10px", borderRadius: "10px", background: "rgba(14, 165, 233, 0.08)", color: "var(--primary)" }}>
                        {policy.category?.toLowerCase() === "safety" || policy.category?.toLowerCase() === "security" ? <ShieldCheck size={20} /> : <BookOpen size={20} />}
                      </div>
                      <div className="premium-badge" style={{ background: "rgba(255,255,255,0.03)" }}>{policy.category}</div>
                    </div>
                    
                    <div>
                      <h3 style={{ fontSize: "17px", fontWeight: "800", marginBottom: "8px", color: "var(--text-main)" }}>{policy.title}</h3>
                      <div
                        className="policy-preview-content"
                        style={{
                          fontSize: "13px",
                          lineHeight: "1.5",
                          color: "var(--text-muted)",
                          display: "-webkit-box",
                          WebkitLineClamp: 3,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                        dangerouslySetInnerHTML={{ __html: policy.content }}
                      />
                    </div>
                    
                    <div style={{ marginTop: "auto", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: "700", color: "var(--primary)" }}>
                      Read Policy Details <ChevronRight size={14} />
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </section>

          {/* New Section: Finance & Career */}
          <section style={{ marginTop: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              <ReceiptText size={22} color="var(--primary)" />
              <h2 style={{ fontSize: "20px", fontWeight: "800" }}>Finance & Career Management</h2>
            </div>
            
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
                gap: "20px",
              }}
            >
              {/* Reimbursement Form */}
              <div className="glass-card" style={{ padding: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                  <ReceiptText size={18} />
                  <h3 style={{ fontWeight: "700" }}>Request Reimbursement</h3>
                </div>

                <form onSubmit={handleReimbursementSubmit} style={{ display: "grid", gap: "20px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                    <div className="form-group-modern">
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                        <Wallet size={14} color="var(--primary)" />
                        Amount (₹)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        placeholder="0.00"
                        value={reimbursementForm.amount}
                        onChange={(e) => setReimbursementForm(prev => ({ ...prev, amount: e.target.value }))}
                        className="glass-card"
                        style={{ ...inputStyle, borderRadius: "10px", padding: '12px 16px' }}
                      />
                    </div>
                    <div className="form-group-modern">
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                        <Calendar size={14} color="var(--primary)" />
                        Expense Date
                      </label>
                      <input
                        type="date"
                        required
                        value={reimbursementForm.date}
                        onChange={(e) => setReimbursementForm(prev => ({ ...prev, date: e.target.value }))}
                        className="glass-card"
                        style={{ ...inputStyle, borderRadius: "10px", padding: '12px 16px' }}
                      />
                    </div>
                  </div>

                  <div className="form-group-modern">
                    <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', display: 'block' }}>Reason / Description</label>
                    <textarea
                      required
                      rows={2}
                      placeholder="e.g., Client meeting travel, Office supplies..."
                      value={reimbursementForm.reason}
                      onChange={(e) => setReimbursementForm(prev => ({ ...prev, reason: e.target.value }))}
                      className="glass-card"
                      style={{ ...inputStyle, resize: "none", borderRadius: "10px", padding: '12px 16px' }}
                    />
                  </div>

                  <div className="form-group-modern">
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                      <Eye size={14} color="var(--primary)" />
                      Bill / Receipt Attachment
                    </label>
                    <div 
                      className="glass-card" 
                      style={{ 
                        position: 'relative',
                        padding: '20px', 
                        border: '2px dashed var(--border)',
                        borderRadius: '12px',
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        background: receiptFile ? 'rgba(14, 165, 233, 0.05)' : 'transparent'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                      onMouseOut={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                    >
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={(e) => setReceiptFile(e.target.files[0])}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          opacity: 0,
                          cursor: 'pointer',
                          width: '100%',
                          height: '100%'
                        }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                        {previewUrl ? (
                          <div style={{ position: 'relative', width: '100%', maxWidth: '200px', height: '120px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                            <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }} className="preview-overlay">
                              <PlusCircle size={24} color="white" />
                            </div>
                          </div>
                        ) : (
                          <Download size={24} color={receiptFile ? 'var(--primary)' : 'var(--text-muted)'} />
                        )}
                        <span style={{ fontSize: '13px', fontWeight: '600', color: receiptFile ? 'var(--text-main)' : 'var(--text-muted)' }}>
                          {receiptFile ? receiptFile.name : "Click to upload bill image or PDF"}
                        </span>
                        {!receiptFile && <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Max file size: 5MB</span>}
                      </div>
                    </div>
                  </div>

                  <button 
                    className="btn-primary" 
                    disabled={actionLoading === "reimbursement"}
                    style={{ padding: "16px", borderRadius: "12px", fontWeight: "800", fontSize: '15px', letterSpacing: '0.5px' }}
                  >
                    {actionLoading === "reimbursement" ? <Loader size={20} className="spinner" /> : "Submit Reimbursement Claim"}
                  </button>
                </form>

                {/* My Reimbursements List */}
                <div style={{ marginTop: "24px", maxHeight: "200px", overflowY: "auto", display: "grid", gap: "10px" }}>
                  <h4 style={{ fontSize: "12px", fontWeight: "700", color: "var(--text-muted)", textTransform: "uppercase" }}>My Recent Claims</h4>
                  {myReimbursements.length === 0 ? (
                    <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>No claims submitted yet.</p>
                  ) : (
                    myReimbursements.map(claim => (
                      <div key={claim.id} style={{ padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <div style={{ fontWeight: "600", fontSize: "13px" }}>${claim.amount} - {claim.reason}</div>
                          <div style={{ fontSize: "11px", color: "var(--text-muted)" }}>{new Date(claim.date).toLocaleDateString()}</div>
                        </div>
                        <span style={{ 
                          padding: "2px 8px", 
                          borderRadius: "10px", 
                          fontSize: "10px", 
                          fontWeight: "700",
                          ...getStatusStyle(claim.status)
                        }}>
                          {claim.status}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Resignation Form */}
              <div className="glass-card" style={{ padding: "24px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                  <UserMinus size={18} />
                  <h3 style={{ fontWeight: "700" }}>Career: Submit Resignation</h3>
                </div>

                {myResignation && myResignation.status?.toLowerCase() !== "rejected" ? (
                  <div style={{ padding: "20px", borderRadius: "12px", background: "rgba(239, 68, 68, 0.05)", border: "1px solid rgba(239, 68, 68, 0.1)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                      <h4 style={{ fontWeight: "700", color: "#ef4444" }}>Active Resignation</h4>
                      <span style={{ 
                        padding: "4px 10px", 
                        borderRadius: "20px", 
                        fontSize: "11px", 
                        fontWeight: "800",
                        ...getStatusStyle(myResignation.status)
                      }}>
                        {myResignation.status}
                      </span>
                    </div>
                    <div style={{ display: "grid", gap: "12px", fontSize: "14px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: 'center' }}>
                        <span style={{ color: "var(--text-muted)" }}>Last Working Day:</span>
                        <span style={{ fontWeight: "700" }}>{new Date(myResignation.proposedLastWorkingDay).toLocaleDateString()}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: 'center' }}>
                        <span style={{ color: "var(--text-muted)" }}>Notice Period:</span>
                        <span style={{ fontWeight: "600" }}>{myResignation.noticePeriod} Days</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: 'center' }}>
                        <span style={{ color: "var(--text-muted)" }}>FNF Status:</span>
                        <span style={{ fontWeight: "800", color: "var(--primary)" }}>{myResignation.fnfStatus}</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => setViewingResignation(true)}
                      style={{ 
                        marginTop: "20px", 
                        width: "100%", 
                        padding: "12px", 
                        borderRadius: "10px", 
                        border: "1px solid var(--border)",
                        background: "rgba(255,255,255,0.03)",
                        color: "var(--text-main)",
                        fontWeight: "700",
                        fontSize: "13px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "8px"
                      }}
                    >
                      <Eye size={16} /> View Resignation Details
                    </button>

                    <p style={{ marginTop: "16px", fontSize: "12px", color: "var(--text-muted)", fontStyle: "italic", textAlign: 'center' }}>
                      Official exit process initiated.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleResignationSubmit} style={{ display: "grid", gap: "20px" }}>
                    <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.1)', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#ef4444', marginBottom: '8px' }}>
                        <AlertCircle size={18} />
                        <span style={{ fontWeight: '800', fontSize: '14px' }}>Important Notice</span>
                      </div>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5' }}>
                        Resignations are subject to a standard <strong>30-day notice period</strong>. Your final last working day will be confirmed by HR.
                      </p>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                      <div className="form-group-modern">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                          <Calendar size={14} color="#ef4444" />
                          Proposed Last Working Day
                        </label>
                        <input
                          type="date"
                          required
                          value={resignationForm.proposedLastWorkingDay}
                          onChange={(e) => setResignationForm(prev => ({ ...prev, proposedLastWorkingDay: e.target.value }))}
                          className="glass-card"
                          style={{ ...inputStyle, borderRadius: "10px", padding: '12px 16px' }}
                        />
                      </div>
                      <div className="form-group-modern">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                          <Clock size={14} color="#ef4444" />
                          Notice Period (Days)
                        </label>
                        <input
                          type="number"
                          readOnly
                          value={30}
                          className="glass-card"
                          style={{ ...inputStyle, borderRadius: "10px", padding: '12px 16px', opacity: 0.7, background: 'rgba(255,255,255,0.02)' }}
                        />
                      </div>
                    </div>

                    <div className="form-group-modern">
                      <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', display: 'block' }}>Reason for Resignation</label>
                      <textarea
                        required
                        rows={3}
                        placeholder="Please provide a detailed reason for your departure..."
                        value={resignationForm.reason}
                        onChange={(e) => setResignationForm(prev => ({ ...prev, reason: e.target.value }))}
                        className="glass-card"
                        style={{ ...inputStyle, resize: "none", borderRadius: "10px", padding: '12px 16px' }}
                      />
                    </div>

                    <div className="form-group-modern">
                      <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                        <Layers size={14} color="#ef4444" />
                        Handover Plan & Tasks
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Outline your plan to transition your responsibilities..."
                        value={resignationForm.handoverPlan}
                        onChange={(e) => setResignationForm(prev => ({ ...prev, handoverPlan: e.target.value }))}
                        className="glass-card"
                        style={{ ...inputStyle, resize: "none", borderRadius: "10px", padding: '12px 16px' }}
                      />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', borderRadius: '10px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                       <input 
                        type="checkbox" 
                        id="assetsCheck"
                        checked={resignationForm.companyAssetsHandover}
                        onChange={(e) => setResignationForm(prev => ({ ...prev, companyAssetsHandover: e.target.checked }))}
                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                       />
                       <label htmlFor="assetsCheck" style={{ fontSize: '13px', cursor: 'pointer' }}>I have initiated the handover of all company assets (Laptop, ID, etc.)</label>
                    </div>

                    <button 
                      className="btn-primary" 
                      disabled={actionLoading === "resignation"}
                      style={{ padding: "18px", borderRadius: "12px", fontWeight: "800", background: "linear-gradient(to right, #ef4444, #f43f5e)", fontSize: '16px', marginTop: '10px' }}
                    >
                      {actionLoading === "resignation" ? <Loader size={22} className="spinner" /> : "Submit Formal Resignation"}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </section>
        </>
      )}

      {/* Policy View Modal */}
      {viewingPolicy && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.7)",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            className="glass-card"
            style={{
              width: "100%",
              maxWidth: "850px",
              padding: "48px",
              maxHeight: "85vh",
              overflowY: "auto",
              position: "relative",
              border: "1px solid var(--border)",
            }}
          >
            <button
              onClick={() => setViewingPolicy(null)}
              style={{
                position: "absolute",
                right: "24px",
                top: "24px",
                padding: "10px",
                color: "var(--text-muted)",
                backgroundColor: "rgba(255,255,255,0.05)",
                borderRadius: "50%",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.1)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.05)")}
            >
              <X size={20} />
            </button>

            <div style={{ marginBottom: "40px", borderBottom: "1px solid var(--border)", paddingBottom: "24px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: "800",
                    color: "var(--primary)",
                    textTransform: "uppercase",
                    letterSpacing: "1.5px",
                    backgroundColor: "rgba(var(--primary-rgb), 0.1)",
                    padding: "4px 10px",
                    borderRadius: "6px",
                  }}
                >
                  {viewingPolicy.category}
                </span>
                <div style={{ width: "4px", height: "4px", borderRadius: "50%", backgroundColor: "var(--border)" }} />
                <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: "500" }}>
                  Verified Company Document
                </span>
              </div>
              <h2
                style={{
                  fontSize: "36px",
                  fontWeight: "900",
                  lineHeight: "1.2",
                  marginBottom: "16px",
                  letterSpacing: "-0.5px",
                  color: "var(--text-main)",
                }}
              >
                {viewingPolicy.title}
              </h2>
            </div>

            <div
              className="policy-doc-container"
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.02)",
                borderRadius: "16px",
                padding: "32px",
                border: "1px solid var(--border)",
                marginTop: "8px",
              }}
            >
              <div
                className="policy-full-content"
                style={{
                  fontSize: "16px",
                  lineHeight: "1.8",
                  color: "rgba(255, 255, 255, 0.9)",
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                }}
                dangerouslySetInnerHTML={{ __html: viewingPolicy.content }}
              />
            </div>

            <button
              onClick={() => setViewingPolicy(null)}
              className="btn-primary"
              style={{ 
                marginTop: "40px", 
                width: "100%",
                padding: "16px",
                fontSize: "16px",
                fontWeight: "800",
                borderRadius: "12px",
                boxShadow: "0 10px 20px -5px rgba(var(--primary-rgb), 0.3)"
              }}
            >
              I have read and acknowledged
            </button>
          </div>
        </div>
      )}
      {/* Resignation View Modal */}
      {viewingResignation && myResignation && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(12px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
            padding: "20px",
          }}
        >
          <div
            className="glass-card"
            style={{
              width: "100%",
              maxWidth: "600px",
              padding: "40px",
              position: "relative",
              border: "1px solid var(--border)",
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
            }}
          >
            <button
              onClick={() => setViewingResignation(false)}
              style={{
                position: "absolute",
                right: "24px",
                top: "24px",
                padding: "8px",
                color: "var(--text-muted)",
                background: "rgba(255,255,255,0.05)",
                borderRadius: "50%",
              }}
            >
              <X size={20} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '32px' }}>
              <div style={{ 
                width: '64px', 
                height: '64px', 
                borderRadius: '20px', 
                background: 'rgba(239, 68, 68, 0.1)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                margin: '0 auto 16px',
                color: '#ef4444'
              }}>
                <UserMinus size={32} />
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>Resignation Details</h2>
              <span style={{ 
                padding: "4px 12px", 
                borderRadius: "20px", 
                fontSize: "12px", 
                fontWeight: "800",
                ...getStatusStyle(myResignation.status)
              }}>
                {myResignation.status}
              </span>
            </div>

            <div style={{ display: 'grid', gap: '20px' }}>
              <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Reason for Resignation</label>
                <p style={{ fontSize: '14px', lineHeight: '1.6' }}>{myResignation.reason}</p>
              </div>

              <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)' }}>
                <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Handover Plan</label>
                <p style={{ fontSize: '14px', lineHeight: '1.6' }}>{myResignation.handoverPlan || 'No handover plan provided.'}</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Submission Date</label>
                  <p style={{ fontWeight: '600' }}>{new Date(myResignation.submissionDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: '800', color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: '4px' }}>Proposed LWD</label>
                  <p style={{ fontWeight: '600' }}>{new Date(myResignation.proposedLastWorkingDay).toLocaleDateString()}</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px', borderRadius: '10px', background: 'rgba(34, 197, 94, 0.05)', border: '1px solid rgba(34, 197, 94, 0.1)' }}>
                <CheckCircle size={16} color="#22c55e" />
                <span style={{ fontSize: '13px', color: '#22c55e', fontWeight: '600' }}>
                  {myResignation.companyAssetsHandover ? "Assets Handover Initiated" : "Assets Handover Pending"}
                </span>
              </div>
            </div>

            <button 
              onClick={() => setViewingResignation(false)}
              className="btn-primary"
              style={{ width: '100%', marginTop: '32px', padding: '16px', borderRadius: '12px', fontWeight: '800' }}
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

const styles = `  /* Policy Content Styling */
  .policy-full-content {
    max-width: 100%;
  }
  .policy-full-content ul, .policy-full-content ol {
    padding-left: 20px;
    margin-bottom: 24px;
    margin-top: 12px;
    list-style-position: outside;
  }
  .policy-full-content li {
    margin-bottom: 12px;
    padding-left: 12px;
  }
  .policy-full-content p {
    margin-bottom: 20px;
  }
  .policy-full-content strong {
    color: var(--text-main);
    font-weight: 700;
  }
  .policy-full-content h1, .policy-full-content h2, .policy-full-content h3 {
    margin-top: 32px;
    margin-bottom: 16px;
    font-weight: 800;
    color: var(--text-main);
    letter-spacing: -0.3px;
    line-height: 1.3;
  }
  .policy-full-content h1 { font-size: 26px; }
  .policy-full-content h2 { font-size: 22px; }
  .policy-full-content h3 { font-size: 19px; }

  .policy-preview-content * {
    margin: 0 !important;
    padding: 0 !important;
    font-size: 12px !important;
  }
`;

const StyleInjector = () => <style>{styles}</style>;

export default () => (
  <>
    <StyleInjector />
    <EmployeePortal />
  </>
);
