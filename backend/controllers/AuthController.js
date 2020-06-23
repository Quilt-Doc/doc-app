const passport = require("passport");
const CLIENT_HOME_PAGE_URL = "http://localhost:3000";

loginSuccess = (req, res) => {
    if (req.user) {
        return res.json({
            success: true,
            authenticated: true,
            message: "user has successfully authenticated",
            user: req.user,
            cookies: req.cookies
        });
    } 
    return res.json({
        success: false,
        authenticated: false,
        user: {}
    })
}

loginFailed = (req, res) => {
    return res.status(401).json({
        success: false,
        message: "user failed to authenticate."
    });
}

logout = (req, res) => {
    req.logout()
    res.redirect(CLIENT_HOME_PAGE_URL);
}

module.exports = {
    loginSuccess, loginFailed, logout
}