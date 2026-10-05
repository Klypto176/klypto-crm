import React, { useState, useEffect } from "react";
import {
  Wallet2,
  BadgeIndianRupee,
  Calculator,
  Plus,
  Loader,
  XCircle,
  CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";
import apiClient from "../../api/apiClient";
import { formatCurrency } from "../../utils/currency";

const PayrollStructure = () => {
  const [structures, setStructures] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [employeeFilter, setEmployeeFilter] = useState("all");
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: "",
    basicSalary: 0,
    hra: 0,
    allowances: 0,
    deductions: 0,
  });

  const fetchData = async () => {
    try {
      const [structRes, empRes] = await Promise.all([
        apiClient.get("/payroll/structures"),
        apiClient.get("/employees"),
      ]);
      setStructures(structRes.data);
      setEmployees(empRes.data);
    } catch (err) {
      console.error("Failed to fetch payroll data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSetupSalary = async (e) => {
    e.preventDefault();
    try {
      await apiClient.post("/payroll/structures", {
        ...formData,
        basicSalary: Number(formData.basicSalary),
        hra: Number(formData.hra),
        allowances: Number(formData.allowances),
        deductions: Number(formData.deductions),
      });
      setShowSetupModal(false);
      fetchData();
    } catch (err) {
      console.error("Failed to setup salary", err);
      alert("Failed to save salary structure");
    }
  };

  const handleRunPayroll = async () => {
    if (
      !window.confirm(
        "Are you sure you want to process payroll for the current month?",
      )
    )
      return;
    setProcessing(true);
    try {
      const now = new Date();
      await apiClient.post("/payroll/process", {
        month: now.getMonth() + 1,
        year: now.getFullYear(),
      });
      alert("Payroll processed successfully!");
    } catch (err) {
      console.error("Failed to process payroll", err);
      alert("Failed to process payroll. Ensure salary structures are setup.");
    } finally {
      setProcessing(false);
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

  const totalMonthlyPayout = structures.reduce(
    (acc, curr) =>
      acc + (curr.basicSalary + curr.hra + curr.allowances - curr.deductions),
    0,
  );

  const availableDepartments = Array.from(
    new Set(
      structures
        .map((structure) => structure.employee?.department)
        .filter(Boolean),
    ),
  );

  const filteredStructures = structures.filter((structure) => {
    const departmentMatch =
      departmentFilter === "all" ||
      structure.employee?.department === departmentFilter;
    const employeeMatch =
      employeeFilter === "all" || structure.employeeId === employeeFilter;
    return departmentMatch && employeeMatch;
  });
  const hasActiveFilters =
    departmentFilter !== "all" || employeeFilter !== "all";

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
          Payroll Management
        </h2>
        <div style={{ display: "flex", gap: "12px" }}>
          <button
            onClick={() => setShowSetupModal(true)}
            style={{
              padding: "10px 16px",
              borderRadius: "8px",
              backgroundColor: "var(--column-bg)",
              border: "1px solid var(--border)",
              color: "var(--text-main)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <Plus size={18} /> Setup Salary
          </button>
          <button
            onClick={handleRunPayroll}
            disabled={processing}
            className="btn-primary"
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            {processing ? (
              <Loader className="spinner" size={18} />
            ) : (
              <Calculator size={18} />
            )}
            Process Payroll
          </button>
        </div>
      </div>

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
          <Wallet2 size={18} /> Financial Summary
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
              label: "Total Monthly Payout",
              amount: formatCurrency(totalMonthlyPayout),
              icon: <BadgeIndianRupee size={18} />,
            },
            {
              label: "Active Salary Structures",
              amount: structures.length.toString(),
              icon: <CheckCircle2 size={18} />,
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                padding: "20px",
                borderRadius: "12px",
                backgroundColor: "var(--column-bg)",
                border: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "12px",
                }}
              >
                <div style={{ color: "var(--primary)" }}>{item.icon}</div>
                <span style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                  This Month
                </span>
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color: "var(--text-muted)",
                  marginBottom: "4px",
                }}
              >
                {item.label}
              </div>
              <div style={{ fontSize: "24px", fontWeight: "800" }}>
                {item.amount}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-card" style={{ padding: "24px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "16px",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <h3 style={{ fontSize: "18px", fontWeight: "700" }}>
            Salary Registry ({filteredStructures.length})
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                alignItems: "flex-end",
              }}
            >
              <div
                style={{ display: "flex", flexDirection: "column", gap: "4px" }}
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
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  style={{
                    padding: "8px 10px",
                    borderRadius: "8px",
                    backgroundColor: "var(--input-bg)",
                    border: "1px solid var(--border)",
                    color: "var(--text-main)",
                    fontSize: "12px",
                    minWidth: "150px",
                  }}
                >
                  <option value="all">All Departments</option>
                  {availableDepartments.map((department) => (
                    <option key={department} value={department}>
                      {department}
                    </option>
                  ))}
                </select>
              </div>
              <div
                style={{ display: "flex", flexDirection: "column", gap: "4px" }}
              >
                <label
                  style={{
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    fontWeight: "700",
                    letterSpacing: "0.4px",
                  }}
                >
                  FILTER EMPLOYEE
                </label>
                <select
                  value={employeeFilter}
                  onChange={(e) => setEmployeeFilter(e.target.value)}
                  style={{
                    padding: "8px 10px",
                    borderRadius: "8px",
                    backgroundColor: "var(--input-bg)",
                    border: "1px solid var(--border)",
                    color: "var(--text-main)",
                    fontSize: "12px",
                    minWidth: "170px",
                  }}
                >
                  <option value="all">All Employees</option>
                  {employees.map((employee) => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name}
                    </option>
                  ))}
                </select>
              </div>
              {hasActiveFilters && (
                <button
                  onClick={() => {
                    setDepartmentFilter("all");
                    setEmployeeFilter("all");
                  }}
                  style={{
                    padding: "8px 12px",
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
                {departmentFilter === "all"
                  ? "All Departments"
                  : departmentFilter}
              </strong>{" "}
              ·{" "}
              <strong>
                {employeeFilter === "all"
                  ? "All Employees"
                  : employees.find((employee) => employee.id === employeeFilter)
                      ?.name || "Selected Employee"}
              </strong>
            </div>
          </div>
        </div>
        <div style={{ display: "grid", gap: "12px" }}>
          {structures.length === 0 ? (
            <div style={{ color: "var(--text-muted)", fontSize: "14px" }}>
              No salary structures defined.
            </div>
          ) : filteredStructures.length === 0 ? (
            <div style={{ color: "var(--text-muted)", fontSize: "14px" }}>
              No salary structures match the selected filters.
            </div>
          ) : (
            filteredStructures.map((struct) => (
              <div
                key={struct.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr 1fr 1fr",
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
                    {struct.employee?.name}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    {struct.employee?.role}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    Earnings
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: "600" }}>
                    {formatCurrency(
                      struct.basicSalary + struct.hra + struct.allowances,
                    )}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    Deductions
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: "600",
                      color: "#ef4444",
                    }}
                  >
                    -{formatCurrency(struct.deductions)}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontSize: "12px", color: "var(--text-muted)" }}>
                    Net Net Pay
                  </div>
                  <div
                    style={{
                      fontSize: "16px",
                      fontWeight: "800",
                      color: "#10b981",
                    }}
                  >
                    {formatCurrency(
                      struct.basicSalary +
                        struct.hra +
                        struct.allowances -
                        struct.deductions,
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {showSetupModal && (
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
                Setup Salary Structure
              </h3>
              <button onClick={() => setShowSetupModal(false)}>
                <XCircle size={20} />
              </button>
            </div>

            <form
              onSubmit={handleSetupSalary}
              style={{ display: "grid", gap: "16px" }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "13px",
                    marginBottom: "8px",
                  }}
                >
                  Employee
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
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
                </select>
              </div>

              <div
                style={{
                  显示: "grid",
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
                    }}
                  >
                    Basic Salary
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.basicSalary}
                    onChange={(e) =>
                      setFormData({ ...formData, basicSalary: e.target.value })
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
                    }}
                  >
                    HRA
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.hra}
                    onChange={(e) =>
                      setFormData({ ...formData, hra: e.target.value })
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
                    }}
                  >
                    Allowances
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.allowances}
                    onChange={(e) =>
                      setFormData({ ...formData, allowances: e.target.value })
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
                    }}
                  >
                    Deductions
                  </label>
                  <input
                    type="number"
                    required
                    value={formData.deductions}
                    onChange={(e) =>
                      setFormData({ ...formData, deductions: e.target.value })
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

              <button
                type="submit"
                className="btn-primary"
                style={{ marginTop: "12px" }}
              >
                Save Structure
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default PayrollStructure;
