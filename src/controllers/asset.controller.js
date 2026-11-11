import UserModel from "../models/user.model.js";
import AssetModel from "../models/asset.model.js";

const ASSET_FIELD = new Set([
    'asset_type',
    'name',
    'current_value',
])

const ASSET_TYPE = new Set([
    'REAL_ESTATE',
    'VEHICLE',
    'GOLD',
    'STOCK',
    'CASH',
    'OTHER'
])

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

// Validate thay đổi của ít nhất 1 trường
const validateChanges = (body) => {
    const entries = Object.entries(body);
    if (entries.length === 0) {
        return 'ít nhất một trường hợp lệ là bắt buộc';
    }

    if (entries.some(([field]) => !ASSET_FIELD.has(field))) {
        return 'Request body chứa các trường không hợp lệ';
    }

    for (const [key, value] of entries) {
        if(key === "asset_type" &&
            (!value || 
                (!ASSET_TYPE.has(value))))
            return "Loại tài sản không hợp lệ, phải là 'REAL_ESTATE', 'VEHICLE', 'GOLD', 'STOCK', 'CASH' hoặc 'OTHER'";

        if(key === "name" && (!value))
            return "Vui lòng nhập tên tài sản";

        // Phải để undefined thì mới so sánh được số
        if(key === "current_value" &&
            (isNotNumber(value) || value <= 0))
            return "Giá trị hiện tại phải là 1 số thập phân dương, tối đa 2 chữ số sau dấu phảy";
    }

    return null;
}


// Lấy danh sách tài sản
export const getAssets = async (req, res) => {
    const user = await getUser(req, res);
    const user_id = user.id;
    const { asset_id, page, month, year } = req.query;
    try {
        const assets = isValidId(asset_id) ? await AssetModel.readById(user_id, asset_id)
                                           : await AssetModel.readAll(user_id, page, month, year);
        if(assets.length > 0)
        {
            return res.status(200).json({
                status: "success",
                data: assets
            });
        }
        return res.status(400).json({
            status: "false",
            message: "Không tìm thấy dữ liệu!"
        });
    } catch (error) {
        
    }
};


// Thêm tài sản mới
export const addNewAsset = async (req, res) => {
    const user = await getUser(req, res);
    const user_id = user.id;

    const { asset_type, name, current_value } = req.body;

    const body = {
        asset_type: asset_type,
        name: name,
        current_value, current_value
    };

    const validationError = validateChanges(body);
    if (validationError) {
        return res.status(400).json({ status: "false", message: validationError });
    };

    try {
        const id = await AssetModel.create(user_id, asset_type, name, current_value);
        if (id) {
            return res.status(200).json({
                status: "success",
                message: "Đã thêm tài sản thành công"
            })
        }
        return res.status(400).json({
            status: "false",
            message: "Thêm tài sản thất bại"
        })
    } catch (error) {
        return res.status(400).json({
            status: "false",
            message: "Có lỗi xảy ra từ phía máy chủ",
        });
    }
};

// Sưa tài sản
export const editAsset = async (req, res) => {
    const user = await getUser(req, res);
    const user_id = user.id;

    // Để cái này trước vì chạy lệnh delete nó xóa luôn trường asset_id
    const { asset_id } = req.body;

    if(!isValidId(asset_id))
    {
        return res.status(400).json({
            status: "false",
            message: "Id tài sản không hợp lệ"
        })
    }

    const body = req.body;
    delete body.asset_id;

    const validationError = validateChanges(body);
    if (validationError) {
        return res.status(400).json({ status: "false", message: validationError });
    };

    try {
        const affected = await AssetModel.update(asset_id, user_id, body);
        if(affected)
        {
            return res.status(200).json({
                status: "success",
                message: "Đã sửa tài sản thành công"
            })
        }
        return res.status(400).json({
            status: "false",
            message: "Sửa tài sản thất bại"
        })
    } catch (error) {
        console.log(error)
        return res.status(400).json({
            status: "false",
            message: "Có lỗi xảy ra từ phía máy chủ",
        });
    }
}


// Xóa tài sản
export const deleteAsset = async (req, res) => {
    const user = await getUser(req, res);
    const user_id = user.id;

    const { asset_id } = req.body;

    if(!isValidId(asset_id))
    {
        return res.status(400).json({
            status: "false",
            message: "Id tài sản không hợp lệ"
        })
    }

    try {
        const affected = await AssetModel.delete(asset_id, user_id);
        if(affected)
        {
            return res.status(200).json({
                status: "success",
                message: "Đã xóa tài sản thành công"
            })
        }
        return res.status(400).json({
            status: "false",
            message: "Xóa tài sản thất bại"
        })
    } catch (error) {
        console.log(error)
        return res.status(400).json({
            status: "false",
            message: "Có lỗi xảy ra từ phía máy chủ",
        });
    }
}