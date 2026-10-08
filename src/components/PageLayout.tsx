import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom"
import { logout } from "../services/auth"

const navItems = [
    { label: "Dashboard", to: "/dashboard", title: "Dashboard", subtitle: "Overview of your store" },
    { label: "Tables", to: "/table", title: "Tables", subtitle: "Manage tables and sessions" },
]

export default function PageLayout() {
    const navigate = useNavigate()
    const { pathname } = useLocation()
    const current = navItems.find((item) => pathname.startsWith(item.to))

    const handleLogout = () => {
        logout()
        navigate("/login", { replace: true })
    }

    const closeDrawer = () => {
        const toggle = document.getElementById("nav-drawer") as HTMLInputElement | null
        if (toggle) toggle.checked = false
    }

    return (
        <div className="drawer min-h-screen bg-slate-100 lg:drawer-open">
            <input id="nav-drawer" type="checkbox" className="drawer-toggle" />

            <div className="drawer-content flex min-w-0 flex-col gap-4 p-4 lg:p-6">
                <header className="flex items-center gap-3 rounded-2xl bg-white px-5 py-4 shadow-sm">
                    <label
                        htmlFor="nav-drawer"
                        aria-label="Open menu"
                        className="btn btn-ghost btn-square btn-sm lg:hidden"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </label>

                    <div>
                        <h1 className="text-xl font-semibold text-slate-900">
                            {current?.title ?? "Bida 298"}
                        </h1>
                        <p className="text-sm text-slate-500">{current?.subtitle}</p>
                    </div>
                </header>

                <main className="min-w-0 flex-1">
                    <Outlet />
                </main>
            </div>

            <div className="drawer-side z-40">
                <label htmlFor="nav-drawer" aria-label="Close menu" className="drawer-overlay" />

                <aside className="flex min-h-full w-64 flex-col bg-white p-4 lg:m-6 lg:mr-0 lg:min-h-0 lg:rounded-2xl lg:shadow-sm">
                    <div className="px-3 py-4 text-xl font-semibold tracking-tight text-emerald-800">
                        Bida 298
                    </div>

                    <p className="mt-4 px-3 text-xs font-medium uppercase tracking-wide text-slate-400">
                        Menu
                    </p>

                    <nav className="mt-2 flex flex-col gap-1">
                        {navItems.map((item) => (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                onClick={closeDrawer}
                                className={({ isActive }) =>
                                    `rounded-xl px-3 py-2.5 text-sm font-medium transition ${
                                        isActive
                                            ? "bg-emerald-700 text-white"
                                            : "text-slate-600 hover:bg-slate-100"
                                    }`
                                }
                            >
                                {item.label}
                            </NavLink>
                        ))}
                    </nav>

                    <div className="mt-auto border-t border-slate-200 pt-4">
                        <button
                            type="button"
                            onClick={handleLogout}
                            className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition hover:bg-slate-100"
                        >
                            Logout
                        </button>
                    </div>
                </aside>
            </div>
        </div>
    )
}
