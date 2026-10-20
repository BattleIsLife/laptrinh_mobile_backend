export const loggingMiddleware = (req, res, next) => {
    // Trả về phương thức và url của request
    console.log(`${req.method} - ${req.url}`);
    next();
}