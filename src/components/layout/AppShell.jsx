import React from "react";
import { Sidebar } from "./Sidebar";
import { Topbar } from "./Topbar";

export function AppShell({ activeKey, onNavigate, title, children }) {
  return (
    <div className="h-screen overflow-hidden bg-slate-100">
      <div className="flex h-full">
        <Sidebar activeKey={activeKey} onNavigate={onNavigate} />

        <div className="flex-1 flex flex-col min-w-0 h-full">
          <Topbar title={title} />
          <main className="flex-1 overflow-y-auto p-6">{children}</main>
        </div>
      </div>
    </div>
  );
}

