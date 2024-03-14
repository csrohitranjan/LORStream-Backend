export const isStudentAuth = (req, res, next) => {

    const { role } = req.user;

    if (role === 'student') {
        next(); // Role is student, proceed to the next middleware
    } else {
        return res.status(403).json({
            status: 403,
            message: "Unauthorized Access: student privileges required"
        })
    }
};