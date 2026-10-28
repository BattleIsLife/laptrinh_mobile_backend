**Lưu ý**: Vui lòng copy thủ công .env.example sang .env rồi mới chạy lệnh `docker-compose`

```bash
# Build container khi mới cài
docker-compose up -d --build

# Đóng container
docker-compose down

# Mở container khi đã cài xong
docker-compose up -d

```

## Hồ sơ cá nhân

Các API dưới đây sử dụng `id` của người dùng trong bảng `users`. Chỉ các trường hồ sơ được cho phép mới có thể cập nhật; `password_hash` không được trả về hoặc chỉnh sửa qua các API này.

### Lấy hồ sơ

```http
GET /api/users/1/profile
```

### Cập nhật một phần hồ sơ

```http
PATCH /api/users/1/profile
Content-Type: application/json
```

```json
{
  "full_name": "Nguyen Van A",
  "date_of_birth": "2000-01-15",
  "occupation": "Nhân viên văn phòng",
  "number_of_dependents": 1,
  "monthly_income": 15000000
}
```

Các trường có thể cập nhật: `full_name`, `date_of_birth`, `occupation`, `number_of_dependents`, `monthly_income`. Có thể gửi một hoặc nhiều trường; gửi `null` cho `date_of_birth` hoặc `occupation` để xóa giá trị. API trả về hồ sơ đã cập nhật, lỗi dữ liệu với mã `400`, hoặc `404` nếu không tìm thấy người dùng.

> Lưu ý: dự án hiện chưa có xác thực người dùng. Không nên đưa endpoint hồ sơ lên môi trường thật nếu chưa giới hạn quyền truy cập theo người dùng đã đăng nhập.