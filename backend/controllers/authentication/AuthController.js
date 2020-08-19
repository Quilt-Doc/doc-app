const CLIENT_HOME_PAGE_URL = "http://localhost:3000/repository";
const client = require("../../apis/api").requestClient();

loginSuccess = (req, res) => {
    console.log("REQ USER", req.user)
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

checkInstallation = async (req, res) => {
    const response = await client.get("/user/installations",  
        { headers: {
                Authorization: `token ${req.body.accessToken}`,
                Accept: 'application/vnd.github.machine-man-preview+json'
            }
        })
    return res.json(response.data.installations)
}   

retrieveDomainRepositories = async (req, res) => {
    const response = await client.get("/user/repos",  
    { headers: {
            Authorization: `token ${req.body.accessToken}`,
            Accept: 'application/vnd.github.machine-man-preview+json'
        }
    })
    filteredResponse = response.data.filter(item => item.permissions.admin === true)
    return res.json(filteredResponse)
}

module.exports = {
    loginSuccess, loginFailed, logout, checkInstallation, retrieveDomainRepositories
}