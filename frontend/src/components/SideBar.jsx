import React from "react"
import { NavLink, useLocation, useParams } from "react-router-dom"
import {
  HomeIcon,
  UsersIcon,
  UserPlusIcon,
  PlusCircleIcon,
  ArrowLeftOnRectangleIcon,
  ChatBubbleLeftRightIcon
} from "@heroicons/react/24/outline"

const SideBar = () => {
  const location = useLocation()
  const { groupId } = useParams()
  const insideGroup = location.pathname.startsWith("/group-members")

  const link = (to, Icon, label) => (
    <NavLink
      to={to}
      className={({ isActive }) => (isActive ? "sidebar-link sidebar-link-active" : "sidebar-link")}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </NavLink>
  )

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h2 className="sidebar-title">Menu</h2>
      </div>

      <nav className="sidebar-nav" aria-label="main navigation">
        {link("/home", HomeIcon, "Home")}
        {link("/createGroup", PlusCircleIcon, "Create group")}
        {link("/family-groups", UsersIcon, "My groups")}
        {link("/addMember", UserPlusIcon, "Add members")}
        {link("/chat", ChatBubbleLeftRightIcon, "Chat")}


        {insideGroup && (
          <NavLink
            to={`/group-members/${groupId}`}
            className={({ isActive }) => (isActive ? "sidebar-link sidebar-link-active" : "sidebar-link")}
          >
            <UsersIcon className="h-5 w-5" />
            Group members
          </NavLink>
        )}
      </nav>

      <div className="sidebar-footer">
        <button
          type="button"
          className="sidebar-logout"
          onClick={() => {
            // sign out placeholder
            // add your sign out logic here: clear auth, redirect, etc.
            window.location.href = "/signin"
          }}
        >
          <ArrowLeftOnRectangleIcon className="h-5 w-5" />
          Sign out
        </button>
      </div>
    </aside>
  )
}

export default SideBar
