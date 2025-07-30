
const success = (res, data = {}, message = "") => {
    return res.status(200).json({
        success: true,
        data,
        message
    });
};

const error = (res, statusCode = 500, message = "", error = "") => {
    return res.status(statusCode).json({
        success: false,
        message,
        error
    });
};

module.exports = { success, error };

