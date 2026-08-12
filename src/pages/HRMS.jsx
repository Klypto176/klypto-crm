import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart3,
  GitBranch,
  Clock3,
  CalendarCheck2,
  Wallet2,
  Award,
  Laptop2,
  Plus,
  ArrowLeft,
  FileText,
  ReceiptText,
  UserMinus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import HRMSOverview from "../components/hrms/HRMSOverview";
import OrgStructure from "../components/hrms/OrgStructure";
import Attendance from "../components/hrms/Attendance";
import LeaveManagement from "../components/hrms/LeaveManagement";
import PayrollStructure from "../components/hrms/PayrollStructure";
import PerformanceReviews from "../components/hrms/PerformanceReviews";
import PoliciesHub from "../components/hrms/PoliciesHub";
import ReimbursementList from "../components/hrms/ReimbursementList";
import ResignationList from "../components/hrms/ResignationList";

const TabContent = ({ title, children, showAdd = true }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3 }}
    className="erp-tab-content"
  >
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "24px",
        gap: "16px",
        flexWrap: "wrap",
      }}
    >
      <h2 style={{ fontSize: "24px", fontWeight: "700" }}>{title}</h2>
      {showAdd && (
        <button
          className="btn-primary"
          style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
        >
          <Plus size={18} /> Add New
        </button>
      )}
    </div>
    {children}
  </motion.div>
);

const HR = ({ initialTab = "overview" }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(initialTab);
  const tabNavRef = useRef(null);
  const dragStateRef = useRef({ isDragging: false, startX: 0, scrollLeft: 0 });

  const tabs = useMemo(
    () => [
      { id: "overview", label: "Overview", icon: <BarChart3 size={18} /> },
      { id: "structure", label: "Structure", icon: <GitBranch size={18} /> },
      { id: "attendance", label: "Attendance", icon: <Clock3 size={18} /> },
      { id: "leave", label: "Leave", icon: <CalendarCheck2 size={18} /> },
      { id: "payroll", label: "Payroll", icon: <Wallet2 size={18} /> },
      { id: "performance", label: "Performance", icon: <Award size={18} /> },
      { id: "policies", label: "Policies", icon: <FileText size={18} /> },
      { id: "reimbursements", label: "Reimbursements", icon: <ReceiptText size={18} /> },
      { id: "resignations", label: "Resignations", icon: <UserMinus size={18} /> },
    ],
    [],
  );

  useEffect(() => {
    if (!tabs.some((tab) => tab.id === activeTab)) {
      setActiveTab("overview");
    }
  }, [activeTab, tabs]);

  useEffect(() => {
    const activeButton = tabNavRef.current?.querySelector(
      `[data-tab="${activeTab}"]`,
    );

    activeButton?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }, [activeTab]);

  const handleTabDragStart = (event) => {
    if (!tabNavRef.current) return;

    dragStateRef.current = {
      isDragging: true,
      startX: event.clientX,
      scrollLeft: tabNavRef.current.scrollLeft,
    };

    tabNavRef.current.classList.add("is-dragging");
  };

  const handleTabDragMove = (event) => {
    if (!dragStateRef.current.isDragging || !tabNavRef.current) return;

    event.preventDefault();
    const deltaX = event.clientX - dragStateRef.current.startX;
    tabNavRef.current.scrollLeft = dragStateRef.current.scrollLeft - deltaX;
  };

  const handleTabDragEnd = () => {
    dragStateRef.current.isDragging = false;
    tabNavRef.current?.classList.remove("is-dragging");
  };

  return (
    <div
      className="erp-container"
      style={{
        width: "100%",
        maxWidth: "1400px",
        margin: "0 auto",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        gap: "24px",
      }}
    >
      <header
        className="module-header"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
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
          <h1
            style={{ fontSize: "32px", fontWeight: "800", marginBottom: "4px" }}
          >
            HR Portal
          </h1>
          <p style={{ color: "var(--text-muted)" }}>
            Manage people operations, attendance, leave, payroll, and employee
            self-service.
          </p>
        </div>
      </header>

      <div
        ref={tabNavRef}
        className="glass-card module-subnav"
        onPointerDown={handleTabDragStart}
        onPointerMove={handleTabDragMove}
        onPointerUp={handleTabDragEnd}
        onPointerLeave={handleTabDragEnd}
        onPointerCancel={handleTabDragEnd}
        style={{
          display: "flex",
          gap: "4px",
          alignContent: "center",
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
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          cursor: "grab",
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            data-tab={tab.id}
            className="module-subnav-item"
            onClick={() => setActiveTab(tab.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 16px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "600",
              transition: "all 0.2s ease",
              color: activeTab === tab.id ? "white" : "var(--text-muted)",
              backgroundColor:
                activeTab === tab.id ? "var(--primary)" : "transparent",
              flex: "0 0 auto",
              whiteSpace: "nowrap",
              scrollSnapAlign: "center",
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <main style={{ flex: 1, position: "relative" }}>
        <AnimatePresence mode="wait">
          {activeTab === "overview" && (
            <TabContent
              key="overview"
              title="People Operations Overview"
              showAdd={false}
            >
              <HRMSOverview />
            </TabContent>
          )}

          {activeTab === "structure" && (
            <TabContent
              key="structure"
              title="Organization Structure"
              showAdd={false}
            >
              <OrgStructure />
            </TabContent>
          )}

          {activeTab === "attendance" && (
            <TabContent
              key="attendance"
              title="Attendance Tracking"
              showAdd={false}
            >
              <Attendance />
            </TabContent>
          )}

          {activeTab === "leave" && (
            <TabContent key="leave" showAdd={false}>
              <LeaveManagement />
            </TabContent>
          )}

          {activeTab === "payroll" && (
            <TabContent key="payroll" showAdd={false}>
              <PayrollStructure />
            </TabContent>
          )}

          {activeTab === "performance" && (
            <TabContent key="performance" showAdd={false}>
              <PerformanceReviews />
            </TabContent>
          )}
          {activeTab === "policies" && (
            <TabContent key="policies" title="Office Policies" showAdd={false}>
              <PoliciesHub />
            </TabContent>
          )}
          {activeTab === "reimbursements" && (
            <TabContent key="reimbursements" title="Reimbursement Claims" showAdd={false}>
              <ReimbursementList />
            </TabContent>
          )}
          {activeTab === "resignations" && (
            <TabContent key="resignations" title="Resignation Management" showAdd={false}>
              <ResignationList />
            </TabContent>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default HR;
