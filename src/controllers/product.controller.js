import UserModel from '../models/product.model';

export const getProducts = async (req, res) => {
    try{
        const products = await UserModel.getProducts();
        res.status(200).json({status:"success", message:"Lấy toàn bộ sản phẩm thành công", data: products});
    }catch(error){
        res.status(500).json({status:"false", message:"Có lỗi ở phía máy chủ"});
    }
}

export const getProduct = async (req, res) => {
    try{
        const {id} = req.params;
        const product = await UserModel.getProduct(id);
        if(product){
            res.status(200).json({status:"success", message:"Tìm thấy 1 sản phẩm có mã" + id, data: product});
        }else{
            res.status(200).json({status:"success", message:"Không tìm thấy sản phẩm có mã " + id, data: product});
        }
        
    }catch(error){
        console.log(error.message);
        res.status(500).json({status:"false", message:"Có lỗi ở phía máy chủ"});
    }
}

export const createProduct = async (req, res) => {
    try{
        // chưa kiểm tra dữ liệu gửi lên có thiếu hay mã tham chiếu ko tồn tại
        const {ten_hang, gia, so_luong, ma_loai, ma_ncc} = req.body; 
        const data = {
            ten_hang: ten_hang,
            gia: gia,
            so_luong: so_luong,
            ma_loai: ma_loai,
            ma_ncc: ma_ncc
        }
        const insertId = await UserModel.createProduct(data);

        res.status(200).json({status:"success", message:"Thêm sản phẩm mới thành công"})
    }catch(error){
        console.log(error.message);
        res.status(500).send({status:"false", message:"Có lỗi ở phía máy chủ"});
    }
}

export const updateProduct = async (req, res) => {
    try{
        // chưa kiểm tra dữ liệu gửi lên có thiếu hay mã tham chiếu ko tồn tại
        const {id} = req.params;
        const {ten_hang, gia, so_luong, ma_loai, ma_ncc} = req.body; 
        const data = {
            ten_hang: ten_hang,
            gia: gia,
            so_luong: so_luong,
            ma_loai: ma_loai,
            ma_ncc: ma_ncc
        }
        const affectedRows = await UserModel.updateProduct(id, data);

        res.status(200).json({status:"success", message:`Sửa sản phẩm có mã ${id} thành công`})
    }catch(error){
        console.log(error.message);
        res.status(500).send({status:"false", message:"Có lỗi ở phía máy chủ"});
    }
}

export const deleteProduct = async (req, res) => {
    try{
        const {id} = req.params;
        const affectedRows = await UserModel.deleteProduct(id);
        if(affectedRows == 1){
            res.status(200).json({status:"success", message:"Xóa thành công sản phẩm có mã" + id, data: affectedRows});
        }else{
            res.status(200).json({status:"success", message:"Không tìm thấy sản phẩm có mã" + id});
        }
        
    }catch(error){
        console.log(error.message);
        res.status(500).json({status:"false", message:"Có lỗi ở phía máy chủ"});
    }
}