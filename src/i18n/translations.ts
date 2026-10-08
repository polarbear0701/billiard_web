const en = {
    common: {
        close: "Close",
        cancel: "Cancel",
    },
    nav: {
        brand: "Bida 298",
        menu: "Menu",
        dashboard: "Dashboard",
        tables: "Tables",
        logout: "Logout",
        openMenu: "Open menu",
        closeMenu: "Close menu",
    },
    pages: {
        dashboardSubtitle: "Overview of your store",
        tablesSubtitle: "Manage tables and sessions",
    },
    status: {
        AVAILABLE: "Available",
        OCCUPIED: "Occupied",
        MAINTENANCE: "Maintenance",
    },
    type: {
        POOL: "Pool",
        CAROM: "Carom",
        LIBRE: "Libre",
    },
    tables: {
        tableLabel: "Table",
        loading: "Loading tables...",
        totalTables: "Total tables",
        searchPlaceholder: "Search by table or type...",
        allStatuses: "All statuses",
        addTable: "Add table",
        noMatch: "No tables match your filters.",
        perHour: "/ hour",
    },
    session: {
        title: "Start Session",
        tableSection: "Table",
        tableOfType: "{type} table",
        pricing: "Pricing",
        tableType: "Table type",
        ratePerHour: "Rate per hour",
        edit: "Edit",
        save: "Save",
        saving: "Saving...",
        priceInvalid: "Enter a price greater than 0",
        note: "Note: Billing starts as soon as the session begins.",
        start: "Start session",
    },
    create: {
        title: "Add Table",
        tableType: "Table type",
        initialStatus: "Initial status",
        pricePerHour: "Price per hour (VND)",
        pricePlaceholder: "e.g. 60000",
        submit: "Create table",
    },
    language: {
        label: "Language",
    },
}

export type Translations = typeof en

const vi: Translations = {
    common: {
        close: "Đóng",
        cancel: "Hủy",
    },
    nav: {
        brand: "Bida 298",
        menu: "Menu",
        dashboard: "Tổng quan",
        tables: "Bàn",
        logout: "Đăng xuất",
        openMenu: "Mở menu",
        closeMenu: "Đóng menu",
    },
    pages: {
        dashboardSubtitle: "Tổng quan cửa hàng của bạn",
        tablesSubtitle: "Quản lý bàn và phiên chơi",
    },
    status: {
        AVAILABLE: "Trống",
        OCCUPIED: "Đang dùng",
        MAINTENANCE: "Bảo trì",
    },
    type: {
        POOL: "Pool",
        CAROM: "Carom",
        LIBRE: "Libre",
    },
    tables: {
        tableLabel: "Bàn",
        loading: "Đang tải danh sách bàn...",
        totalTables: "Tổng số bàn",
        searchPlaceholder: "Tìm theo bàn hoặc loại bàn...",
        allStatuses: "Tất cả trạng thái",
        addTable: "Thêm bàn",
        noMatch: "Không có bàn nào phù hợp với bộ lọc.",
        perHour: "/ giờ",
    },
    session: {
        title: "Bắt đầu phiên chơi",
        tableSection: "Bàn",
        tableOfType: "Bàn {type}",
        pricing: "Giá",
        tableType: "Loại bàn",
        ratePerHour: "Giá mỗi giờ",
        edit: "Sửa",
        save: "Lưu",
        saving: "Đang lưu...",
        priceInvalid: "Nhập giá lớn hơn 0",
        note: "Lưu ý: Tiền giờ được tính ngay khi phiên chơi bắt đầu.",
        start: "Bắt đầu phiên",
    },
    create: {
        title: "Thêm bàn",
        tableType: "Loại bàn",
        initialStatus: "Trạng thái ban đầu",
        pricePerHour: "Giá mỗi giờ (VND)",
        pricePlaceholder: "VD: 60000",
        submit: "Tạo bàn",
    },
    language: {
        label: "Ngôn ngữ",
    },
}

export type Language = "en" | "vi"

export const translations: Record<Language, Translations> = { en, vi }
