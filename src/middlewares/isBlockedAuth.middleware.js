export const isBlocked = (req, res, next) => {
    if (req.user.isBlocked) {
        return res.status(403).json({
            status: 403,
            message: "Your account is blocked. Please contact admin"
        })
    }
    next();
};