## Build container chạy backend

**Lưu ý**: Vui lòng copy thủ công .env.example sang .env rồi mới chạy lệnh `docker-compose`

```bash
# Build container khi mới cài
docker-compose up -d --build

# Đóng container
docker-compose down

# Mở container khi đã cài xong
docker-compose up -d

```
## Tài liệu API của dự án
Tài liệu API của repo: [nhấn vào đây để xem](documentation/README.md)