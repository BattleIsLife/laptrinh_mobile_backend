# Tài liệu API Income

## Mục lục
- [1. Lấy thông tin 1 thu nhập](#1-lấy-thông-tin-1-thu-nhập)
- [2. Lấy danh sách thu nhập](#2-lấy-danh-sách-thu-nhập)
- [3. Lấy thống kê thu nhập](#3-lấy-thống-kê-thu-nhập)
- [4. Tạo giao dịch thu nhập](#4-tạo-giao-dịch-thu-nhập)
- [5. Cập nhật giao dịch thu nhập](#5-cập-nhật-giao-dịch-thu-nhập)
- [6. Xóa giao dịch thu nhập](#6-xóa-giao-dịch-thu-nhập)

## Lưu ý: Tất cả các API đều Yêu cầu đăng nhập thành công trước đó. Gửi JWT nhận được từ API đăng nhập qua header `Authorization`, theo kiểu xác thực Bearer.
## 1. Lấy thông tin 1 thu nhập
- Tên: API lấy chi tiết thu nhập
- Endpoint: GET `/api/income/:id`
- Mô tả: Lấy chi tiết một bản ghi thu nhập dựa vào mã giao dịch và mã người dùng. Nếu giao dịch có mã đó không thuộc về người dùng thì trả lỗi, ngược lại trả về đầy đủ thông tin.
- `Content-type: application/json `
- **Request body mẫu (có thể để trống)**:

```json
{
	
}
```

-**Response body**:
```json
// Thành công (HTTP Code `200`)
{
	"status": "success", 
    "message": "Lấy thông tin giao dịch thu nhập thành công", 
    "data": { 
        "id": 1, 
        "amount": "15000000.00", 
        "source": "Công ty Công nghệ ABC", 
        "income_type": "SALARY", 
        "transaction_date": "2026-05-31", 
        "description": "Lương tháng 5/2026", 
    }
}
```

```json
// Trường hợp không tìm thấy người dùng (HTTP Code `404`)
{
    "status": "false",
    "message": "Người dùng không tồn tại"
}
```

```json
// Trường hợp mã giao dịch thu nhập không hợp lệ (HTTP Code `400`)
{
    "status": "false",
    "message": "Mã giao dịch thu nhập không hợp lệ"
}
```

```json
// Trường hợp mã giao dịch không tồn tại hoặc giao dịch của người dùng khác (HTTP Code `404`)
{
    "status": "false",
    "message": "Không tìm thấy giao dịch thu nhập"
}
```

## 2. Lấy danh sách thu nhập
- Tên: API lấy danh sách thu nhập của người dùng
- Endpoint: GET `/api/income/` 
(Query String: page mặc định là 0, khoảng thời gian lấy dữ liệu mặc định là tháng này năm này, vd: /api/income?page=1&month=11&year=2026)
- Mô tả: Lấy danh sách các giao dịch thu nhập của người dùng, có giới hạn về số bản ghi mỗi lần lấy 
- `Content-type: application/json `
- **Request body mẫu (có thể để trống, chủ yếu gửi phạm vi cần lấy dữ liệu qua Query String)**:

```json
{

}
```

- **Response body**:
```json
// Thành công (HTTP Code `200`)
{
	"status": "success", 
    "message": "Lấy danh sách thu nhập thành công", 
    "data": [ 
        { 
            "id": 1, 
            "amount": "15000000.00", 
            "source": "Công ty Công nghệ ABC", 
            "income_type": "SALARY", 
            "transaction_date": "2026-05-31", 
            "description": "Lương tháng 5", 
        }, 
        { 
            "id": 2, 
            "amount": "2500000.00", 
            "source": "Dự án Web Freelance", 
            "income_type": "BUSINESS", 
            "transaction_date": "2026-06-02", 
            "description": "Ứng trước tiền làm website bán hàng", 
        },
        { 
            "id": 3, 
            "amount": "1200000.00", 
            "source": "Cổ tức quý 1", 
            "income_type": "INVESTMENT", 
            "transaction_date": "2026-06-03", 
            "description": "Nhận cổ tức từ cổ phiếu chứng khoán", 
        }
    ], 
    "total_items": 3 // số bản ghi tìm thấy được
}
```

```json
// Trường hợp không tìm thấy người dùng (HTTP Code `404`)
{
	"status": "false",
    "message": "Người dùng không tồn tại"

}
```

## 3. Lấy thống kê thu nhập
- Tên: API lấy thống kê thu nhập của user
- Endpoint: GET `/api/income/statistic`
(khoảng thời gian lấy dữ liệu mặc định là tháng này năm này, vd: api/income/statistic?month=11&year=2026)
- Mô tả: Lấy tổng thu nhập, biến động thu nhập và cơ cấu thu nhập (theo income_type) của người dùng trong khoảng thời gian
- `Content-type: application/json `
- **Request body mẫu (có thể để trống)**:

```json
{
	
}
```

- **Response body**:
```json
// Thành công (HTTP Code `200`)
{
	"status": "success", 
    "message": "Lấy thống kê thu nhập thành công", 
    "total_income": "20000000.00",
    "data": [
        {
            "amount":"15000000.00",
            "date":"2026-06-01"
        },
        {
            "amount":"0",
            "date":"2026-06-02"
        },
        // ...
        {
            "amount":"5000000.00",
            "date":"2026-06-08"
        }
        // ... các ngày còn lại trong tháng
    ],
    "structure": {
        "SALARY": "60",
        "BUSINESS": "20",
        "INVESTMENT": "10",
        "OTHER": "10",
    }
}

```

```json
// Trường hợp không tìm thấy người dùng (HTTP Code `404`)
{
	"status": "false",
    "message": "Người dùng không tồn tại"
}
```

## 4. Tạo giao dịch thu nhập
- Tên: API thêm giao dịch thu nhập
- Endpoint: POST `/api/income/`
- Mô tả: Nhận thông tin từ người dùng, thực hiện validate dữ liệu. Nếu hợp lệ thì ghi nhận vào CSDL, ngược lại báo lỗi tương ứng về cho người dùng.
- `Content-type: application/json `
- **Request body mẫu**:

```json
{
    "amount": "5000000", // lưu ý số tiền không được chứa phần thập phân
    "source": "Dự án Freelance", 
    "income_type": "BUSINESS", 
    "transaction_date": "2026-08-05", 
    "description": "Tiền ứng trước dự án app mobile" 
}
```

- **Response body**:
```json
// Thành công (HTTP Code `201`)
{
	"status":"success",
	"message":"Tạo giao dịch thu nhập thành công"
}
```

```json
// Trường hợp không tìm thấy người dùng (HTTP Code `404`)
{
	"status": "false",
    "message": "Người dùng không tồn tại"
}
```

```json
// Trường hợp dữ liệu không hợp lệ (HTTP Code `400`)
{
	"status": "false", 
    "message": "Dữ liệu đầu vào không hợp lệ", 
    "errors": { 
        "source": "Tên nguồn thu nhập không được quá 50 ký tự",
        "amount": "Số tiền không được để trống / Số tiền phải là một chuỗi ký tự số / Số tiền không được âm, giá trị tối thiểu là 1 và chứa tối đa 13 chữ số, không được phần thập phân", 
        "income_type": "Loại thu nhập không hợp lệ",
        "transaction_date" : "Ngày giao dịch không được để trống / Ngày giao dịch không hợp lệ (phải có dạng YYYY-MM-DD và năm lớn hơn 1900)",
        "description" : "Mô tả không được quá 255 ký tự"
    } 
}
```

## 5. Cập nhật giao dịch thu nhập
- Tên: API cập nhật giao dịch thu nhập
- Endpoint: PUT `/api/income/:id`
- Mô tả: Nhận thông tin từ người dùng, thực hiện validate dữ liệu. Nếu hợp lệ thì cập nhận thông tin giao dịch vào CSDL, ngược lại báo lỗi tương ứng về cho người dùng.
- `Content-type: application/json `
- **Request body mẫu**:

```json
{
	"amount": "7000000.00", 
    "source": "Dự án Freelance (đã cộng thưởng)", 
    "income_type": "BUSINESS", 
    "transaction_date": "2026-06-05", 
    "description": "Tiền ứng trước dự án app mobile" 
}
```

- **Respond body**:
```json
// Thành công (HTTP Code `200`)
{
	"status":"success",
	"message":"Cập nhật giao dịch thu nhập thành công"
}
```

```json
// Trường hợp không tìm thấy người dùng (HTTP Code `404`)
{
	"status": "false",
    "message": "Người dùng không tồn tại"   
}
```

```json
// Trường hợp mã giao dịch thu nhập không hợp lệ (HTTP Code `400`)
{
	"status": "false",
    "message": "Mã giao dịch thu nhập không hợp lệ"
}
```

```json
// Trường hợp mã giao dịch không tồn tại hoặc giao dịch của người dùng khác (HTTP Code `404`)
{
	"status": "false",
    "message": "Không tìm thấy giao dịch thu nhập để cập nhật"
}
```

```json
// Trường hợp dữ liệu không hợp lệ (HTTP Code `400`)
{
	"status": "false", 
    "message": "Dữ liệu đầu vào không hợp lệ", 
    "errors": { 
        "source": "Tên nguồn thu nhập không được quá 50 ký tự",
        "amount": "Số tiền không được để trống / Số tiền phải là một chuỗi ký tự số / Số tiền không được âm, giá trị tối thiểu là 1 và chứa tối đa 13 chữ số, không được phần thập phân", 
        "income_type": "Loại thu nhập không hợp lệ",
        "transaction_date" : "Ngày giao dịch không được để trống / Ngày giao dịch không hợp lệ (phải có dạng YYYY-MM-DD và năm lớn hơn 1900)",
        "description" : "Mô tả không được quá 255 ký tự"
    } 
}
```

## 6. Xóa giao dịch thu nhập
- Tên: API xóa giao dịch thu nhập
- Endpoint: DELETE `/api/income/:id`
- Mô tả: Xóa giao dịch thu nhập từ người dùng trong trường hợp có sai sót khi tạo dữ liệu
- `Content-type: application/json `
- **Request body mẫu (có thể để trống)**:

```json
{
	
}
```

- **Response body**:
```json
// Thành công (HTTP Code `200`)
{
	"status":"success",
	"message":"Xóa giao dịch thu nhập thành công"
}
```

```json
// Trường hợp không tìm thấy người dùng (HTTP Code `404`)
{
	"status": "false",
    "message": "Người dùng không tồn tại"
}
```

```json
// Trường hợp mã giao dịch thu nhập không hợp lệ (HTTP Code `400`)
{
	"status": "false",
    "message": "Mã giao dịch thu nhập không hợp lệ"
}
```

```json
// Trường hợp mã giao dịch không tồn tại hoặc giao dịch của người dùng người khác  (HTTP Code `404`)
{
	"status": "false",
    "message": "Không tìm thấy giao dịch thu nhập để xóa"
}
```