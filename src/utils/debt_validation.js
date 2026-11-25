const MAX_UNSIGNED_BIGINT = 18446744073709551615n;
const MONEY_PATTERN = /^(0|[1-9]\d{0,12})(\.\d{1,2})?$/;

export const isValidId = (value) => {
    const id = String(value);
    return /^[1-9]\d*$/.test(id) && BigInt(id) <= MAX_UNSIGNED_BIGINT;
};

export const isValidDate = (value) => {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const [year, month, day] = value.split("-").map(Number);
    if (year < 1000) {
        return false;
    }

    const date = new Date(Date.UTC(year, month - 1, day));
    return date.getUTCFullYear() === year
        && date.getUTCMonth() === month - 1
        && date.getUTCDate() === day;
};

export const isValidDecimalNumber = (value, maxIntegerDigits = 13) => {
    const stringValue = typeof value === "number" && Number.isFinite(value)
        ? String(value)
        : value;
    if (typeof stringValue !== "string" && typeof stringValue !== "number") {
        return false;
    }

    const pattern = maxIntegerDigits === 13
        ? MONEY_PATTERN
        : new RegExp(`^(0|[1-9]\\d{0,${maxIntegerDigits - 1}})(\\.\\d{1,2})?$`);
    return pattern.test(String(stringValue));
};

export const toMinorUnits = (value) => {
    const [whole, fraction = ""] = String(value).split(".");
    return BigInt(whole) * 100n + BigInt(fraction.padEnd(2, "0"));
};

export const fromMinorUnits = (value) => {
    const amount = BigInt(value);
    return `${amount / 100n}.${String(amount % 100n).padStart(2, "0")}`;
};

export const dateToString = (value) => {
    if (!(value instanceof Date)) {
        return value;
    }

    return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
};
