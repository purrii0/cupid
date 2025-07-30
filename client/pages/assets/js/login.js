// assets/check-auth.js
(function() {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");
    const pathname = window.location.pathname;
    const currentPage = pathname.substring(pathname.lastIndexOf("/") + 1);

    const isAuthPage = ["login.html", "signup.html", "reset-password.html", "home.html"].includes(currentPage);
    const isProtectedPage = ["discover.html", "messages.html", "profile.html", "settings.html", "swipe.html"].includes(currentPage);

    // If not logged in and trying to access protected page
    if (!token && isProtectedPage) {
        window.location.replace("login.html");
        return;
    }

    // If logged in and trying to access auth page like login or signup
    if (token && isAuthPage) {
        window.location.replace("discover.html");
        return;
    }

    // If on discover but token was deleted midway (e.g., in sessionStorage only)
    if (!token && currentPage === "discover.html") {
        window.location.replace("login.html");
        return;
    }
});

