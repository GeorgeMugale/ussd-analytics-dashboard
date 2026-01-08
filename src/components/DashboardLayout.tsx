import React, {
  useState,
  useContext,
  createContext,
  type ReactElement,
  type ReactNode,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  LayoutDashboard,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

// --- Context Definitions ---

type DashboardContextType = {
  activeId: string | null;
  setActiveId: (id: string) => void;
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
};

const DashboardContext = createContext<DashboardContextType | undefined>(
  undefined
);

const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error("Dashboard components must be used within a Dashboard");
  }
  return context;
};

// --- Types ---

export type DashboardItemProps = {
  id: string;
  title: string;
  icon: ReactElement;
  description?: string;
  children?: ReactNode;
};

export type DashboardSectionProps = {
  title: string;
  icon: ReactElement;
  children: ReactNode;
  defaultOpen?: boolean;
};

// --- Helper Components ---

// A tooltip that only shows when the sidebar is collapsed
const SidebarTooltip = ({ text }: { text: string }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 20 }}
      exit={{ opacity: 0, x: 10 }}
      className="absolute left-full top-1/2 -translate-y-1/2 z-50 bg-gray-800 text-white text-xs px-2 py-1 rounded shadow-md whitespace-nowrap pointer-events-none"
    >
      {text}
      {/* Little arrow pointing left */}
      <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 border-4 border-transparent border-r-gray-800" />
    </motion.div>
  );
};

// --- Components ---

export const DashboardItem: React.FC<DashboardItemProps> = ({
  id,
  title,
  icon,
}) => {
  const { activeId, setActiveId, isCollapsed } = useDashboard();
  const isActive = activeId === id;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <button
      onClick={() => setActiveId(id)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative w-full flex items-center p-3 rounded-lg my-1 transition-all duration-200 ${
        isActive
          ? "bg-blue-100 text-blue-800"
          : "text-gray-600 hover:bg-gray-100"
      } ${isCollapsed ? "justify-center" : ""}`}
    >
      <span className={`text-lg flex-shrink-0 ${isCollapsed ? "" : "mr-3"}`}>
        {icon}
      </span>

      {!isCollapsed && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm font-medium whitespace-nowrap overflow-hidden"
        >
          {title}
        </motion.span>
      )}

      {/* Tooltip for collapsed state */}
      <AnimatePresence>
        {isCollapsed && isHovered && <SidebarTooltip text={title} />}
      </AnimatePresence>
    </button>
  );
};

export const DashboardSection: React.FC<DashboardSectionProps> = ({
  title,
  icon,
  children,
  defaultOpen = true,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const { isCollapsed, setIsCollapsed } = useDashboard();
  const [isHovered, setIsHovered] = useState(false);

  // If sidebar is collapsed, handle interaction differently
  const handleToggle = () => {
    // If collapsed and user clicks a section, they probably want to see the menu.
    // Option A: Just expand the accordion (icons drop down)
    // Option B: Auto-expand the sidebar
    setIsOpen(!isOpen);
  };

  return (
    <div className="mb-2 relative">
      <button
        onClick={handleToggle}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`w-full flex items-center p-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors duration-200 ${
          isCollapsed ? "justify-center" : "justify-between"
        }`}
      >
        <div className="flex items-center">
          <span
            className={`text-lg flex-shrink-0 ${isCollapsed ? "" : "mr-3"}`}
          >
            {icon}
          </span>
          {!isCollapsed && (
            <span className="text-sm font-semibold whitespace-nowrap">
              {title}
            </span>
          )}
        </div>

        {!isCollapsed && (
          <motion.span
            animate={{ rotate: isOpen ? 0 : -90 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={16} />
          </motion.span>
        )}

        {/* Tooltip for collapsed state (Section Title) */}
        <AnimatePresence>
          {isCollapsed && isHovered && <SidebarTooltip text={title} />}
        </AnimatePresence>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            {/* When collapsed, remove padding so icons align vertically */}
            <ul
              className={`${
                isCollapsed ? "" : "pl-4 border-l-2 border-gray-100 ml-4"
              } mt-1 transition-all duration-300`}
            >
              {children}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Content Renderer Component (Same as before)
const ActiveContentRenderer = ({ children }: { children: ReactNode }) => {
  const { activeId } = useDashboard();

  let activeContent: ReactElement<DashboardItemProps> | null = null;

  const findActive = (nodes: ReactNode) => {
    React.Children.forEach(nodes, (child) => {
      if (!React.isValidElement(child)) return;
      if ((child.props as any).id === activeId) {
        activeContent = child as ReactElement<DashboardItemProps>;
        return;
      }
      if ((child.props as any).children) {
        findActive((child.props as any).children);
      }
    });
  };

  findActive(children);

  if (!activeContent) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-400">
        <LayoutDashboard size={48} className="mb-4 opacity-20" />
        <p>Select an item from the menu</p>
      </div>
    );
  }

  const {
    title,
    description,
    children: itemChildren,
  } = (activeContent as any).props;

  return (
    <div className="p-8 rounded-xl shadow-sm border border-gray-100 min-h-[80vh] bg-white">
      <motion.div
        key={activeId}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-2">{title}</h2>
        {description && <p className="text-gray-500 mb-6">{description}</p>}
        <div className="mt-6">{itemChildren}</div>
      </motion.div>
    </div>
  );
};

export type DashboardProps = {
  title: string;
  children: ReactNode;
  defaultActiveId?: string;
};

export default function Dashboard({
  title,
  children,
  defaultActiveId,
}: DashboardProps) {
  const getFirstId = (nodes: ReactNode): string | null => {
    let foundId: string | null = null;
    React.Children.forEach(nodes, (child) => {
      if (foundId) return;
      if (!React.isValidElement(child)) return;
      if ((child.props as any).id) foundId = (child.props as any).id;
      if (!foundId && (child as any).props.children)
        foundId = getFirstId((child as any).props.children);
    });
    return foundId;
  };

  const [activeId, setActiveId] = useState<string | null>(
    defaultActiveId || getFirstId(children)
  );

  // New state for handling Collapse
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <DashboardContext.Provider
      value={{ activeId, setActiveId, isCollapsed, setIsCollapsed }}
    >
      <div className="flex h-screen bg-gray-50 overflow-hidden">
        {/* Sidebar */}
        <motion.aside
          initial={false}
          animate={{ width: isCollapsed ? 80 : 256 }} // 80px (w-20) vs 256px (w-64)
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="bg-white shadow-xl z-20 flex flex-col flex-shrink-0 border-r border-gray-200 relative"
        >
          {/* Sidebar Header */}
          <div
            className={`h-16 flex items-center ${
              isCollapsed ? "justify-center" : "px-6"
            } border-b border-gray-100 bg-blue-700 transition-all`}
          >
            {!isCollapsed ? (
              <h1 className="text-white font-bold text-lg tracking-wide truncate">
                {title}
              </h1>
            ) : (
              <h1 className="text-white font-bold text-lg">
                {title.charAt(0)}
              </h1>
            )}
          </div>

          <nav className="flex-1 overflow-y-auto p-4 custom-scrollbar overflow-x-hidden">
            {children}
          </nav>

          {/* Toggle Button */}
          <div className="p-4 border-t border-gray-100 flex justify-end">
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className={`p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-all ${
                isCollapsed ? "w-full flex justify-center" : ""
              }`}
            >
              {isCollapsed ? (
                <ChevronsRight size={20} />
              ) : (
                <ChevronsLeft size={20} />
              )}
            </button>
          </div>
        </motion.aside>

        {/* Main Area */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header / Top Bar */}
          <header className="h-16 bg-white shadow-sm border-b border-gray-200 flex items-center px-6 z-10">
            {/* You can put breadcrumbs or user profile here */}
            <div className="text-sm text-gray-500">
              Dashboard /{" "}
              <span className="font-medium text-gray-800">{activeId}</span>
            </div>
          </header>

          {/* Main Content Scrollable Area */}
          <main className="flex-1 overflow-auto p-6 bg-slate-50/50">
            <ActiveContentRenderer>{children}</ActiveContentRenderer>
          </main>
        </div>
      </div>
    </DashboardContext.Provider>
  );
}
