export const isAdminAuth = (req, res, next) => {

    const { role } = req.user;

    if (role === 'admin') {
        next(); // Role is admin, proceed to the next middleware
    } else {
        return res.status(403).json({
            status: 403,
            message: "Unauthorized Access: Admin privileges required"
        })
    }
};
