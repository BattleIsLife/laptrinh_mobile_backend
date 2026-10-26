-- ================================================
-- 1. USERS — Người dùng
-- ================================================
CREATE TABLE users (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  phone         VARCHAR(20)  NOT NULL UNIQUE
                COMMENT 'Đăng nhập bằng SĐT',
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  reset_otp     VARCHAR(10) NULL,
  reset_otp_expires TIMESTAMP NULL,
  full_name     VARCHAR(100) NOT NULL,
  date_of_birth DATE         DEFAULT NULL,
  occupation    VARCHAR(100) DEFAULT NULL
                COMMENT 'Nghề nghiệp: nhân viên, tự kinh doanh...',
  number_of_dependents TINYINT UNSIGNED DEFAULT 0
                COMMENT 'Số người phụ thuộc (ảnh hưởng chi tiêu thiết yếu)',
  monthly_income DECIMAL(15,2) DEFAULT 0.00
                COMMENT 'Thu nhập tự khai báo — dùng tính DTI nhanh',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='Người dùng cá nhân';

-- ================================================
-- 2. CATEGORIES — Danh mục thu / chi
-- (Thêm mới so với DB gốc — cần cho expense_transactions)
-- ================================================
CREATE TABLE categories (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(100) NOT NULL
               COMMENT 'Ăn uống, Nhà ở, Đi lại, Giải trí...',
  type         ENUM('INCOME','EXPENSE') NOT NULL,
  icon         VARCHAR(50)  DEFAULT NULL
               COMMENT 'Tên icon Flutter: fastfood, home, work...',
  is_essential BOOLEAN      DEFAULT FALSE
               COMMENT 'TRUE = chi tiêu thiết yếu (tính quỹ khẩn cấp)'
) ENGINE=InnoDB COMMENT='Danh mục thu chi';

-- ================================================
-- 3. INCOME_TRANSACTIONS — Giao dịch thu nhập
-- ================================================
CREATE TABLE income_transactions (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id          BIGINT UNSIGNED NOT NULL,
  amount           DECIMAL(15,2)   NOT NULL,
  source           VARCHAR(150)    DEFAULT NULL
                   COMMENT 'Nguồn: Công ty ABC, Freelance, Cho thuê nhà...',
  income_type      ENUM('SALARY','BUSINESS','INVESTMENT','OTHER')
                   NOT NULL DEFAULT 'SALARY',
  transaction_date DATE            NOT NULL,
  description      VARCHAR(255)    DEFAULT NULL,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_income_date (user_id, transaction_date)
) ENGINE=InnoDB COMMENT='Lịch sử thu nhập';

-- ================================================
-- 4. EXPENSE_TRANSACTIONS — Giao dịch chi tiêu
-- ================================================
CREATE TABLE expense_transactions (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id          BIGINT UNSIGNED NOT NULL,
  category_id      INT UNSIGNED    NOT NULL,
  amount           DECIMAL(15,2)   NOT NULL,
  transaction_date DATE            NOT NULL,
  description      VARCHAR(255)    DEFAULT NULL,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)     REFERENCES users(id)      ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  INDEX idx_user_expense_date (user_id, transaction_date)
) ENGINE=InnoDB COMMENT='Lịch sử chi tiêu';

-- ================================================
-- 5. DEBTS — Khoản nợ / thẻ tín dụng
-- (Sửa từ loans: thêm credit_limit, due_day_of_month)
-- ================================================
CREATE TABLE debts (
  id               BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id          BIGINT UNSIGNED NOT NULL,
  lender_name      VARCHAR(150)    NOT NULL
                   COMMENT 'Vietcombank, HomeCredit, Bạn bè...',
  debt_type        ENUM('CREDIT_CARD','PERSONAL',
                        'MORTGAGE','INSTALLMENT') NOT NULL,
  total_amount     DECIMAL(15,2)   NOT NULL
                   COMMENT 'Tổng nợ ban đầu',
  remaining_amount DECIMAL(15,2)   NOT NULL
                   COMMENT 'Dư nợ còn lại (cập nhật sau mỗi lần trả)',
  credit_limit     DECIMAL(15,2)   DEFAULT 0.00
                   COMMENT 'Hạn mức thẻ — chỉ dùng khi debt_type=CREDIT_CARD',
  monthly_payment  DECIMAL(15,2)   NOT NULL
                   COMMENT 'Số tiền phải trả hàng tháng — dùng tính DTI',
  interest_rate    DECIMAL(5,2)    DEFAULT 0.00
                   COMMENT 'Lãi suất %/năm',
  start_date       DATE            NOT NULL
                   COMMENT 'Ngày bắt đầu vay — tính tuổi tín dụng (NV1)',
  end_date         DATE            DEFAULT NULL
                   COMMENT 'Ngày kết thúc hợp đồng',
  due_day_of_month TINYINT UNSIGNED DEFAULT 1
                   COMMENT 'Ngày chốt thanh toán trong tháng (1–31)',
  status           ENUM('ACTIVE','SETTLED','OVERDUE')
                   DEFAULT 'ACTIVE',
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                   ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Khoản vay và thẻ tín dụng';

-- ================================================
-- 6. DEBT_PAYMENTS — Lịch sử thanh toán nợ
-- (Sửa từ loan_payments: thêm is_late, đổi tên rõ hơn)
-- ================================================
CREATE TABLE debt_payments (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  debt_id      BIGINT UNSIGNED NOT NULL,
  due_date     DATE            NOT NULL
               COMMENT 'Ngày đến hạn phải trả',
  payment_date DATE            DEFAULT NULL
               COMMENT 'Ngày thực tế đã trả — NULL nếu chưa trả',
  amount_due   DECIMAL(15,2)   NOT NULL
               COMMENT 'Số tiền phải trả kỳ này',
  amount_paid  DECIMAL(15,2)   DEFAULT 0.00
               COMMENT 'Số tiền thực tế đã trả',
  is_late      BOOLEAN         DEFAULT FALSE
               COMMENT 'TRUE nếu trả trễ hạn',
  days_late    INT UNSIGNED    DEFAULT 0
               COMMENT 'Số ngày trễ — dùng tính payment_score NV1',
  status       ENUM('PENDING','PAID','LATE','MISSED')
               DEFAULT 'PENDING',
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (debt_id) REFERENCES debts(id) ON DELETE CASCADE,
  INDEX idx_debt_due_date (debt_id, due_date)
) ENGINE=InnoDB COMMENT='Lịch sử thanh toán từng kỳ';

-- ================================================
-- 7. SAVINGS — Mục tiêu tiết kiệm
-- (Thêm interest_rate so với DB gốc)
-- ================================================
CREATE TABLE savings (
  id                   BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id              BIGINT UNSIGNED NOT NULL,
  name                 VARCHAR(100)    NOT NULL
                       COMMENT 'Quỹ khẩn cấp, Mua nhà, Du lịch...',
  target_amount        DECIMAL(15,2)   DEFAULT 0.00
                       COMMENT '0 = quỹ khẩn cấp không có mục tiêu cố định',
  current_amount       DECIMAL(15,2)   DEFAULT 0.00,
  monthly_contribution DECIMAL(15,2)   DEFAULT 0.00
                       COMMENT 'Số tiền đóng góp mỗi tháng',
  interest_rate        DECIMAL(5,2)    DEFAULT 0.00
                       COMMENT 'Lãi suất tiết kiệm %/năm',
  target_date          DATE            DEFAULT NULL,
  status               ENUM('ACTIVE','COMPLETED','CANCELLED')
                       DEFAULT 'ACTIVE',
  created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                       ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Mục tiêu tiết kiệm';

-- ================================================
-- 8. ASSETS — Tài sản
-- ================================================
CREATE TABLE assets (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       BIGINT UNSIGNED NOT NULL,
  asset_type    ENUM('REAL_ESTATE','VEHICLE',
                     'GOLD','STOCK','CASH','OTHER') NOT NULL,
  name          VARCHAR(150)    NOT NULL
                COMMENT 'Căn hộ Q7, Honda SH, Vàng SJC...',
  current_value DECIMAL(15,2)   NOT NULL
                COMMENT 'Giá trị hiện tại (tự khai báo)',
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Tài sản cá nhân';

-- ================================================
-- 9. CREDIT_ACCOUNTS — Tài khoản thẻ tín dụng
-- (Tính credit utilization chính xác hơn debts)
-- ================================================
CREATE TABLE credit_accounts (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         BIGINT UNSIGNED NOT NULL,
  account_type    ENUM('CREDIT_CARD','OVERDRAFT') NOT NULL,
  bank_name       VARCHAR(100)    NOT NULL,
  credit_limit    DECIMAL(15,2)   NOT NULL
                  COMMENT 'Hạn mức được cấp',
  current_balance DECIMAL(15,2)   DEFAULT 0.00
                  COMMENT 'Dư nợ hiện tại đang dùng',
  opened_date     DATE            NOT NULL,
  closed_date     DATE            DEFAULT NULL,
  status          ENUM('ACTIVE','CLOSED') DEFAULT 'ACTIVE',
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB COMMENT='Thẻ tín dụng và hạn mức';

-- ================================================
-- 10. CREDIT_SCORES — Điểm tín dụng
-- (Thêm score_breakdown JSON + dti_ratio so với DB gốc)
-- ================================================
CREATE TABLE credit_scores (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         BIGINT UNSIGNED NOT NULL,
  score           SMALLINT UNSIGNED NOT NULL
                  COMMENT 'Điểm tín dụng 300–850',
  score_tier      ENUM('POOR','FAIR','GOOD',
                       'VERY_GOOD','EXCELLENT') NOT NULL,
  dti_ratio       DECIMAL(5,2)    NOT NULL
                  COMMENT 'Tỷ lệ nợ/thu nhập tại thời điểm tính',
  score_breakdown JSON            NOT NULL
                  COMMENT '{
                    "payment": {"score":240,"max":300,"label":"Lịch sử TT"},
                    "dti":     {"score":200,"max":255,"label":"Mức nợ"},
                    "age":     {"score":100,"max":128,"label":"Tuổi TD"},
                    "util":    {"score":68, "max":85, "label":"Hạn mức"},
                    "mix":     {"score":60, "max":85, "label":"Đa dạng"}
                  }',
  model_version   VARCHAR(20)     DEFAULT 'v1.0'
                  COMMENT 'Phiên bản công thức tính điểm',
  calculated_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_credit_calc (user_id, calculated_at)
) ENGINE=InnoDB COMMENT='Lịch sử điểm tín dụng';

-- ================================================
-- 11. FINANCIAL_SCORES — Điểm sức khỏe tài chính
-- (Thêm emergency_fund_months, savings_rate so với DB gốc)
-- ================================================
CREATE TABLE financial_scores (
  id                    BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id               BIGINT UNSIGNED NOT NULL,
  score                 TINYINT UNSIGNED NOT NULL
                        COMMENT 'Điểm tổng hợp 0–100',
  risk_level            ENUM('LOW','MEDIUM','HIGH') NOT NULL,
  savings_score         TINYINT UNSIGNED DEFAULT 0
                        COMMENT 'Điểm tiết kiệm 0–25',
  debt_score            TINYINT UNSIGNED DEFAULT 0
                        COMMENT 'Điểm gánh nặng nợ 0–25',
  cashflow_score        TINYINT UNSIGNED DEFAULT 0
                        COMMENT 'Điểm dòng tiền thu chi 0–25',
  stability_score       TINYINT UNSIGNED DEFAULT 0
                        COMMENT 'Điểm ổn định thu nhập 0–25',
  savings_rate          DECIMAL(5,2)     DEFAULT 0.00
                        COMMENT 'Tỷ lệ tiết kiệm = (thu-chi)/thu × 100',
  emergency_fund_months DECIMAL(4,1)     DEFAULT 0.0
                        COMMENT 'Quỹ khẩn cấp = tiết kiệm / chi thiết yếu/tháng',
  calculated_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_financial_calc (user_id, calculated_at)
) ENGINE=InnoDB COMMENT='Điểm sức khỏe tài chính';

-- ================================================
-- 12. FINANCIAL_SNAPSHOTS — Tổng hợp tài chính theo tháng
-- ================================================
CREATE TABLE financial_snapshots (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id       BIGINT UNSIGNED NOT NULL,
  period_month  DATE            NOT NULL
                COMMENT 'Lưu ngày đầu tháng: 2024-11-01',
  total_income  DECIMAL(15,2)   DEFAULT 0.00,
  total_expense DECIMAL(15,2)   DEFAULT 0.00,
  total_debt    DECIMAL(15,2)   DEFAULT 0.00,
  total_assets  DECIMAL(15,2)   DEFAULT 0.00,
  savings_amount DECIMAL(15,2)  DEFAULT 0.00,
  net_worth     DECIMAL(15,2)   DEFAULT 0.00
                COMMENT 'Tài sản - Nợ',
  debt_to_income DECIMAL(5,2)   DEFAULT 0.00,
  savings_rate  DECIMAL(5,2)    DEFAULT 0.00,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uq_user_month (user_id, period_month)
) ENGINE=InnoDB COMMENT='Snapshot tài chính theo tháng — dùng vẽ biểu đồ xu hướng';

-- ================================================
-- 13. RECOMMENDATIONS — Gợi ý cải thiện
-- (Thêm credit_score_id link với lần tính điểm)
-- ================================================
CREATE TABLE recommendations (
  id              BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id         BIGINT UNSIGNED NOT NULL,
  credit_score_id BIGINT UNSIGNED DEFAULT NULL
                  COMMENT 'Link với lần tính điểm nào sinh ra gợi ý này',
  type            ENUM('PAYMENT','DEBT','SAVING',
                       'INCOME','UTILIZATION','AGE') NOT NULL,
  title           VARCHAR(200)    NOT NULL,
  content         TEXT            NOT NULL,
  priority        ENUM('HIGH','MEDIUM','LOW') NOT NULL,
  is_read         BOOLEAN         DEFAULT FALSE,
  created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)         REFERENCES users(id)         ON DELETE CASCADE,
  FOREIGN KEY (credit_score_id) REFERENCES credit_scores(id) ON DELETE SET NULL
) ENGINE=InnoDB COMMENT='Gợi ý cải thiện điểm tín dụng';

-- ================================================
-- 14. NOTIFICATIONS — Thông báo
-- ================================================
CREATE TABLE notifications (
  id         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id    BIGINT UNSIGNED NOT NULL,
  title      VARCHAR(200)    NOT NULL,
  content    TEXT            NOT NULL,
  type       ENUM('PAYMENT_DUE','SCORE_UP','SCORE_DOWN',
                  'SAVING_GOAL','TIP','SYSTEM') NOT NULL
             COMMENT 'PAYMENT_DUE: nhắc trả nợ, SCORE_UP/DOWN: điểm thay đổi',
  is_read    BOOLEAN         DEFAULT FALSE,
  created_at TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_notif (user_id, is_read, created_at)
) ENGINE=InnoDB COMMENT='Thông báo và nhắc nhở';