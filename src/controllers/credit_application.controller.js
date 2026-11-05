import CreditApplicationModel from "../models/credit_application.model.js";
import UserModel from "../models/user.model.js";

const isValidId = (id) => {
    const parsedId = String(id);
    if (!/^[1-9]\d*$/.test(parsedId)) {
        return false;
    }
    return BigInt(id) <= 18446744073709551615n;
};

const getUser = async (req, res) => {
    const user_id = req.user?.id
    if (!isValidId(user_id)) {
        return res.status(401).json({ status: 'false', message: 'Token không chứa ID người dùng hợp lệ' });
    }

    try {
        const profile = await UserModel.getProfile(user_id);
        if (!profile) {
            return res.status(404).json({ message: 'Người dùng không tồn tại' });
        }

        return profile;
    } catch (error) {
        console.error('Failed to get profile:', error);
        return res.status(500).json({ message: 'Lỗi máy chủ nội bộ' });
    }
};

// Check kiểu số
const isNotNumber = (val) => typeof val !== 'number' || Number.isNaN(val);


// Lấy thông tin yêu cầu tín dụng của user
export const getApplication = async (req, res) => {
    const user = await getUser(req, res);
    const { application_id } = req.query;
    try {
        const application = isValidId(application_id) ? await CreditApplicationModel.getOneFromUser(user.id, application_id)
                                                      : await CreditApplicationModel.getAllFromUser(user.id);
        if(application)
            return res.status(200).json({ 
                status: "success", 
                data: application
            });
        return res.status(400).json({ 
                status: "false", 
                message: "Không tìm thấy dữ liệu"
            });
    } catch (error) {
        console.log(error)
        return res.status(400).json({
            status: "false",
            message: "Có lỗi xảy ra từ phía máy chủ",
        });
    }
}

// Tạo yêu cầu tín dụng
export const createApplication = async (req, res) => {
    const user = await getUser(req, res);
    const { name, credit_type } = req.body;
    if(!name)
        return res.status(400).json({
            status: "false",
            message: "Vui lòng nhập tên yêu cầu tín dụng",
    });    

    if(!credit_type || (credit_type !== 'CREDIT_CARD' && credit_type !== "OVERDRAFT"))
        return res.status(400).json({
            status: "false",
            message: "Loại tín dụng không hợp lệ, phải là CREDIT_CARD hoặc OVERDRAFT",
    });

    try {
        const insertedId = await CreditApplicationModel.create(user.id, name, credit_type);
        if(insertedId)
            return res.status(200).json({ status: "success", message: "Tạo yêu cầu tín dụng thành công" });
    } catch (error) {
        return res.status(400).json({
            status: "false",
            message: "Có lỗi xảy ra từ phía máy chủ",
        });
    }
};

// Xóa yêu cầu tín dụng
export const deleteAppication = async (req, res) => {
    const user = await getUser(req, res);
    const { application_id } = req.body;
    if(!isValidId(application_id))
        return res.status(400).json({
            status: "false",
            message: "Id yêu cầu tín dụng không hợp lệ",
        });
    try {
        const deleted = await CreditApplicationModel.delete(application_id, user.id)
        if (deleted) {
            return res.status(200).json({ status: "success", message: "Đã xóa yêu cầu tín dụng thành công"});
        }
    } catch (error) {
        return res.status(400).json({
            status: "false",
            message: "Có lỗi xảy ra từ phía máy chủ",
        });   
    }
};