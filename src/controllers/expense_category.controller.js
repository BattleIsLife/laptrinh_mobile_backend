import ExpenseCategoryModel from "../models/expense_category.model.js";

export const getExpenseCaterogies = async (req, res) => {
    try{
        const categories = await ExpenseCategoryModel.getExpenseCaterogies();
        return res.status(200).send({
            status: "success",
            data: categories
        });
    } catch (error) {
        console.log(error.message);
        return res.status(500).json({ status: "false", message: "Có lỗi ở phía máy chủ" });
    }
}