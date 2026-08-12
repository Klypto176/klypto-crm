import React, { useState, useEffect, useCallback, useRef } from "react";
import { CalendarDays, Clock3, CheckCircle2, XCircle, Loader, FileText } from "lucide-react";
import apiClient from "../../api/apiClient";
import { getAttendanceSocket } from "../../api/socketClient";
import AttendanceMonthlyModal from "./AttendanceMonthlyModal";

const Attendance = () => {
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  // Daily Filter State
  const dateObj = new Date();
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  const [selectedDate, setSelectedDate] = useState(`${year}-${month}-${day}`);

  // Modal State
  const [modalEmployee, setModalEmployee] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      const [empRes, attRes] = await Promise.all([
        apiClient.get("/employees"),
        apiClient.get(`/attendance?date=${selectedDate}`),
      ]);
      setEmployees(empRes.data);
      setAttendance(attRes.data);
    } catch (err) {
      console.error("Error fetching attendance data", err);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  const fetchDataRef = useRef(fetchData);
  useEffect(() => {
    fetchDataRef.current = fetchData;
  }, [fetchData]);

  useEffect(() => {
    setLoading(true);
    fetchData();
  }, [fetchData]);

  // The biometric machine pushes punches to the server the moment they happen;
  // the server relays them over this socket so the board updates live instead
  // of polling. Re-fetching on (re)connect also covers anything missed while
  // the socket was briefly down.
  useEffect(() => {
    const socket = getAttendanceSocket();
    if (!socket) return;

    const handleUpdate = () => fetchDataRef.current?.();
    socket.on("attendance:updated", handleUpdate);
    socket.on("connect", handleUpdate);

    return () => {
      socket.off("attendance:updated", handleUpdate);
      socket.off("connect", handleUpdate);
    };
  }, []);

  const activeEmployees = employees.filter(
    (e) => e.status === "Active" || e.status === "Onboarding"
  );

  const rows = activeEmployees.map((emp) => {
    // Backend API already filtered for today's date, just find the matching record
    const record = attendance.find((a) => a.employeeId === emp.id);

    let checkIn = "-";
    let checkOut = "-";
    let workDuration = "00:00";
    let status = "Absent";
    let statusColor = "#ef4444";

    if (record) {
      status = record.status;
      if (record.checkIn) {
        checkIn = new Date(record.checkIn).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      }
      if (record.checkOut) {
        checkOut = new Date(record.checkOut).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
      }

      if (record.checkIn && record.checkOut) {
        const diffMs = new Date(record.checkOut) - new Date(record.checkIn);
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        workDuration = `${diffHrs}:${diffMins.toString().padStart(2, "0")}`;
      }

      if (status === "Present") statusColor = "#10b981";
      else if (status === "Leave") statusColor = "#f59e0b";
      else if (status === "Late") statusColor = "#0ea5e9";
    }

    return {
      id: emp.id,
      name: emp.name,
      checkIn,
      checkOut,
      workDuration,
      status,
      statusColor,
      hasRecord: !!record,
    };
  });



  const presentCount = rows.filter((r) => r.status === "Present").length;
  const leaveCount = rows.filter((r) => r.status === "Leave").length;
  const lateCount = rows.filter((r) => r.status === "Late").length;
  const absentCount = rows.filter((r) => r.status === "Absent").length;

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

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      <div className="glass-card" style={{ padding: "24px" }}>
        <h3
          style={{
            fontSize: "18px",
            fontWeight: "700",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <Clock3 size={18} /> Attendance Summary
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: "16px",
          }}
        >
          {[
            {
              label: "Present Today",
              value: presentCount.toString(),
              icon: <CheckCircle2 size={16} />,
              color: "#10b981",
            },
            {
              label: "On Leave",
              value: leaveCount.toString(),
              icon: <CalendarDays size={16} />,
              color: "#f59e0b",
            },
            {
              label: "Late Check-ins",
              value: lateCount.toString(),
              icon: <Clock3 size={16} />,
              color: "#0ea5e9",
            },
            {
              label: "Absent",
              value: absentCount.toString(),
              icon: <XCircle size={16} />,
              color: "#ef4444",
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                padding: "16px",
                borderRadius: "12px",
                backgroundColor: "var(--column-bg)",
                border: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "10px",
                }}
              >
                <div style={{ color: item.color }}>{item.icon}</div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  Today
                </span>
              </div>
              <div style={{ fontSize: "26px", fontWeight: "800" }}>
                {item.value}
              </div>
              <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card" style={{ padding: "24px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: "700" }}>Daily Attendance Log</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarDays size={18} color="var(--text-muted)" />
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="hrms-input"
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-body)', color: 'var(--text)', outline: 'none', cursor: 'pointer' }}
            />
          </div>
        </div>
        {rows.length === 0 ? (
          <div style={{ color: "var(--text-muted)", fontSize: "14px" }}>
            No active employees available to track.
          </div>
        ) : (
          <div style={{ display: "grid", gap: "12px" }}>
            {rows.map((row) => (
              <div
                key={row.id}
                className="hrms-attendance-row"
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.5fr 1fr 1fr 1fr 1fr 0.5fr",
                  gap: "12px",
                  alignItems: "center",
                  padding: "14px",
                  borderRadius: "12px",
                  backgroundColor: "var(--column-bg)",
                  border: "1px solid var(--border)",
                  fontSize: "13px",
                }}
              >
                <div style={{ fontWeight: "600", display: "flex", flexDirection: "column" }}>
                  <span>{row.name}</span>
                </div>
                <div style={{ color: "var(--text-muted)" }}>
                  <span style={{ fontSize: "11px", display: "block", marginBottom: "2px" }}>In Time</span>
                  <span style={{ fontWeight: "500", color: row.checkIn !== "-" ? "var(--text)" : "inherit" }}>{row.checkIn}</span>
                </div>
                <div style={{ color: "var(--text-muted)" }}>
                  <span style={{ fontSize: "11px", display: "block", marginBottom: "2px" }}>Out Time</span>
                  <span style={{ fontWeight: "500", color: row.checkOut !== "-" ? "var(--text)" : "inherit" }}>{row.checkOut}</span>
                </div>
                <div style={{ color: "var(--text-muted)" }}>
                  <span style={{ fontSize: "11px", display: "block", marginBottom: "2px" }}>Work Dur.</span>
                  <span style={{ fontWeight: "500" }}>{row.workDuration}</span>
                </div>
                <div
                  style={{
                    textAlign: "right",
                    fontWeight: "700",
                    color: row.statusColor,
                  }}
                >
                  {row.status}
                </div>
                <div style={{ textAlign: "right" }}>
                  <button 
                    onClick={() => setModalEmployee({ id: row.id, name: row.name })}
                    title="View Monthly Log"
                    style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: '6px', padding: '6px', cursor: 'pointer', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    <FileText size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalEmployee && (
        <AttendanceMonthlyModal 
          employeeId={modalEmployee.id} 
          employeeName={modalEmployee.name} 
          onClose={() => setModalEmployee(null)} 
        />
      )}
    </div>
  );
};

export default Attendance;
