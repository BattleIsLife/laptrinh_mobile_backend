import pool from "../config/database.js";

const dbPool = pool;

// Lệnh query: kết quả trả về là 2 mảng: rows (dữ liệu truy vấn được) và fields (metadata)
/* Đối với câu SELECT:
+ rows: mảng chứa các object đại diện cho dòng dữ liệu
*/

/* Đối với câu INSERT:
+ rows: là object ResultSetHeader chứa các thông tin quan trọng như insertId và affectedRows
*/

/* Đối với câu UPDATE/DELETE:
+ rows: là object ResultSetHeader chứa các thông tin quan trọng như affectedRows và changedRows
*/

export default class ProductModel {
    static async getProducts() {
        const query = "SELECT * FROM mat_hang";
        const [rows] = await dbPool.query(query); 
        return rows;
    }
    static async getProduct(id){
        const query = "SELECT * FROM mat_hang WHERE ma_hang = ?";
        const [rows] = await dbPool.execute(query, [id]);
        return rows;
    } 
    static async createProduct(data){
        console.log(data);
        const query = "INSERT INTO mat_hang (ten_hang, gia, so_luong, ma_loai, ma_ncc) ";
        + "VALUES (?, ?, ?, ?, ?)";
        const [result] = await dbPool.execute(query, [data.ten_hang, data.gia, data.so_luong, data.ma_loai, data.ma_ncc]);
        return result.insertId;
    }
    static async updateProduct(id, data){
        const query = "UPDATE mat_hang SET ten_hang = ?, gia = ?, so_luong = ?, ma_loai = ?, ma_ncc = ? WHERE ma_hang = ?";
        const [result] = await dbPool.execute(query, [data.ten_hang, data.gia, data.so_luong, data.ma_loai, data.ma_ncc, id]);
        return result.affectedRows;
    }
    static async deleteProduct(id){
        const query = "DELETE FROM mat_hang WHERE ma_hang = ?";
        const [result] = await dbPool.execute(query, [id]);
        return result.affectedRows;
    }
}