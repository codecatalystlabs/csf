"use client"

import React from "react"

import { createContext, useContext, useState, useEffect } from "react"
import { useMediaQuery } from "@/hooks/use-media-query"

type SidebarContextType = {
  isOpen: boolean
  isCollapsed: boolean
  toggle: (e?: React.MouseEvent) => void
  close: (e?: React.MouseEvent) => void
  toggleCollapse: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

// Get the stored sidebar state from localStorage (client-side only)
const getSavedSidebarState = () => {
  if (typeof window !== "undefined") {
    const saved = localStorage.getItem("sidebarCollapsed")
    return saved === "true"
  }
  return false
}

// Add this function to check if an element is a form control
const isFormControl = (element: HTMLElement | null): boolean => {
  if (!element) return false

  const formElements = ["input", "select", "textarea", "button", "a", '[role="tab"]', '[role="tablist"]']

  // Check if the element matches any form control selectors
  return formElements.some((selector) => element.matches(selector) || !!element.closest(selector))
}

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(true)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const isMobile = useMediaQuery("(max-width: 768px)")

  // Initialize sidebar state from localStorage on mount
  useEffect(() => {
    setIsCollapsed(getSavedSidebarState())
  }, [])

  // Close sidebar on mobile by default
  useEffect(() => {
    if (isMobile) {
      setIsOpen(false)
    } else {
      setIsOpen(true)
    }
  }, [isMobile])

  // Update the toggle function to be more selective
  const toggle = (e?: React.MouseEvent) => {
    // If the event came from a form control, don't toggle the sidebar
    if (e && e.target && isFormControl(e.target as HTMLElement)) {
      return
    }
    setIsOpen(!isOpen)
  }

  // Update the close function similarly
  const close = (e?: React.MouseEvent) => {
    // If the event came from a form control, don't close the sidebar
    if (e && e.target && isFormControl(e.target as HTMLElement)) {
      return
    }
    setIsOpen(false)
  }

  const toggleCollapse = () => {
    const newState = !isCollapsed
    setIsCollapsed(newState)
    // Save to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("sidebarCollapsed", String(newState))
    }
  }

  const contextValue = createContextValue({
    isOpen,
    isCollapsed,
    toggle,
    close,
    toggleCollapse,
  })

  return <SidebarContext.Provider value={contextValue}>{children}</SidebarContext.Provider>
}

function createContextValue(value: SidebarContextType) {
  return React.useMemo<SidebarContextType>(
    () => ({
      isOpen: value.isOpen,
      isCollapsed: value.isCollapsed,
      toggle: value.toggle,
      close: value.close,
      toggleCollapse: value.toggleCollapse,
    }),
    [value.isOpen, value.isCollapsed, value.toggle, value.close, value.toggleCollapse],
  )
}

export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}

