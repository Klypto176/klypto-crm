import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import OrgSetup from "../components/erp/OrgSetup";
import EntityManagement from "../components/erp/EntityManagement";
import PartnerMaster from "../components/erp/PartnerMaster";
import FinancialWorkflows from "../components/erp/FinancialWorkflows";
import AssetTracker from "../components/erp/AssetTracker";
import ProjectKanban from "../components/erp/ProjectKanban";
import ApprovalQueue from "../components/erp/ApprovalQueue";
import ERPAnalytics from "../components/erp/ERPAnalytics";
import RecruitmentAssessment from "../components/erp/RecruitmentAssessment";
import GrievanceManagement from "../components/erp/GrievanceManagement";
import Payroll from "../components/erp/Payroll";
import {
  Building2,
  Users2,
  PackageSearch,
  Receipt,
  BarChart3,
  ClipboardList,
  CheckCircle2,
  Box,
  Plus,
  Users,
  ShieldAlert,
  Wallet,
  ArrowLeft,
} from "lucide-react";

const TabContent = ({ title, children, showAdd = true }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.3 }}
    className="erp-tab-content"
  >
    <div
      className="erp-tab-header"
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "24px",
        gap: "16px",
        flexWrap: "wrap",
      }}
    >
      {title && <h2 style={{ fontSize: "24px", fontWeight: "700" }}>{title}</h2>}
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

const ERP = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const navigate = useNavigate();
  const tabNavRef = useRef(null);
  const dragStateRef = useRef({ isDragging: false, startX: 0, scrollLeft: 0 });

  const tabs = [
    { id: "overview", label: "Overview", icon: <BarChart3 size={18} /> },
    { id: "org", label: "Organization", icon: <Building2 size={18} /> },
    { id: "entities", label: "Entities", icon: <Box size={18} /> },
    { id: "partners", label: "Partners", icon: <Users2 size={18} /> },
    { id: "assets", label: "Assets", icon: <PackageSearch size={18} /> },
    { id: "transactions", label: "Transactions", icon: <Receipt size={18} /> },
    { id: "projects", label: "Projects", icon: <ClipboardList size={18} /> },
    { id: "recruitment", label: "Recruitment", icon: <Users size={18} /> },
    { id: "grievances", label: "Grievances", icon: <ShieldAlert size={18} /> },
    { id: "payroll", label: "Payroll", icon: <Wallet size={18} /> },
    { id: "approvals", label: "Approvals", icon: <CheckCircle2 size={18} /> },
  ];

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
          <h1
            style={{ fontSize: "32px", fontWeight: "800", marginBottom: "4px" }}
          >
            ERP Portal
          </h1>
          <p style={{ color: "var(--text-muted)" }}>
            Manage your organization's core operations and resources.
          </p>
        </div>
      </header>

      {/* Tab Navigation */}
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
              title="Business Overview"
              showAdd={false}
            >
              <ERPAnalytics />
            </TabContent>
          )}

          {activeTab === "org" && (
            <TabContent key="org" title="Organization Setup">
              <OrgSetup />
            </TabContent>
          )}

          {activeTab === "entities" && (
            <TabContent key="entities" title="Branches & Departments">
              <EntityManagement />
            </TabContent>
          )}

          {activeTab === "partners" && (
            <TabContent key="partners" title="Vendors & Customers">
              <PartnerMaster />
            </TabContent>
          )}

          {activeTab === "assets" && (
            <TabContent key="assets" title="Asset Management">
              <AssetTracker />
            </TabContent>
          )}

          {activeTab === "transactions" && (
            <TabContent key="transactions" title="Transactions Workflow">
              <FinancialWorkflows />
            </TabContent>
          )}

          {activeTab === "projects" && (
            <TabContent key="projects" title="Project Tracking">
              <ProjectKanban />
            </TabContent>
          )}

          {activeTab === "recruitment" && (
            <TabContent key="recruitment" title="" showAdd={false}>
              <RecruitmentAssessment />
            </TabContent>
          )}

          {activeTab === "grievances" && (
            <TabContent key="grievances" title="" showAdd={false}>
              <GrievanceManagement />
            </TabContent>
          )}

          {activeTab === "payroll" && (
            <TabContent key="payroll" title="" showAdd={false}>
              <Payroll />
            </TabContent>
          )}

          {activeTab === "approvals" && (
            <TabContent
              key="approvals"
              title="Workflow Approvals"
              showAdd={false}
            >
              <ApprovalQueue />
            </TabContent>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default ERP;
