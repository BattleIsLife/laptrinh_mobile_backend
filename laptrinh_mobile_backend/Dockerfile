FROM node:20-alpine

WORKDIR /usr/src/app

# Cài đặt dữ liệu múi giờ cho Alpine Linux
RUN apk add --no-cache tzdata

# Copy dependency specifications
COPY package*.json ./

# Cài đặt dependencies
RUN npm install

# Copy toàn bộ mã nguồn
COPY . .

# Mở port app
EXPOSE 5001

# Chạy app ở chế độ phát triển
CMD ["npm", "run", "dev"]