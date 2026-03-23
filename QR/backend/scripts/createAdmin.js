const path = require("path");
const readline = require("readline/promises");
const { stdin: input, stdout: output } = require("process");
const { v4: createUUID } = require("uuid");

require("dotenv").config({
  path: path.join(__dirname, "..", ".env"),
});

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_GENDERS = ["male", "female", "other", "secret"];
const HELP_TEXT = `
Usage:
  npm run create-admin

Optional flags:
  --fullName "System Admin"
  --email "admin@local.com"
  --phone "0901234567"
  --dob "2000-01-01"
  --gender "secret"
  --avatarUrl "https://example.com/avatar.png"
  --password "12345678"
  --help
`;

// Ham nay dung de phan tich cac tham so CLI de script co the vua prompt vua nhan flag.
// Nhan vao: argv la mang tham so tu process.argv.
// Tra ve: object gom cac cap key/value da parse.
const parseArguments = (argv) => {
  const parsedArgs = {};

  for (let index = 0; index < argv.length; index += 1) {
    const currentValue = argv[index];

    if (!currentValue.startsWith("--")) {
      continue;
    }

    const argumentKey = currentValue.slice(2);

    if (argumentKey === "help") {
      parsedArgs.help = true;
      continue;
    }

    const nextValue = argv[index + 1];

    if (!nextValue || nextValue.startsWith("--")) {
      parsedArgs[argumentKey] = "";
      continue;
    }

    parsedArgs[argumentKey] = nextValue;
    index += 1;
  }

  return parsedArgs;
};

// Ham nay dung de hoi nguoi van hanh mot gia tri neu flag chua duoc truyen san.
// Nhan vao: rl la readline interface, promptText la noi dung hoi va fallbackValue la gia tri mac dinh.
// Tra ve: chuoi nguoi dung vua nhap hoac fallback neu bo trong.
const promptForValue = async (rl, promptText, fallbackValue = "") => {
  const defaultSuffix = fallbackValue ? ` [${fallbackValue}]` : "";
  const answer = await rl.question(`${promptText}${defaultSuffix}: `);
  return String(answer || fallbackValue || "").trim();
};

// Ham nay dung de validate payload admin truoc khi hash password va INSERT.
// Nhan vao: adminPayload la object chua thong tin co ban cua admin moi.
// Tra ve: object da duoc normalize, nem loi neu du lieu khong hop le.
const validateAdminPayload = (adminPayload) => {
  const fullName = String(adminPayload.fullName || "").trim();
  const email = String(adminPayload.email || "").trim().toLowerCase();
  const phone = String(adminPayload.phone || "").trim() || null;
  const avatarUrl = String(adminPayload.avatarUrl || "").trim() || null;
  const dob = String(adminPayload.dob || "").trim();
  const gender = String(adminPayload.gender || "secret").trim().toLowerCase() || "secret";
  const password = String(adminPayload.password || "");

  if (!fullName) {
    throw new Error("Full name is required.");
  }

  if (!EMAIL_PATTERN.test(email)) {
    throw new Error("Email is invalid.");
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dob) || Number.isNaN(new Date(dob).getTime())) {
    throw new Error("Date of birth must follow YYYY-MM-DD.");
  }

  if (!ALLOWED_GENDERS.includes(gender)) {
    throw new Error(`Gender must be one of: ${ALLOWED_GENDERS.join(", ")}.`);
  }

  if (password.length < 8) {
    throw new Error("Password must contain at least 8 characters.");
  }

  return {
    fullName,
    email,
    phone,
    avatarUrl,
    dob,
    gender,
    password,
  };
};

// Ham nay dung de thu thap thong tin tao admin tu flag hoac prompt terminal.
// Nhan vao: parsedArgs la object da parse tu process.argv.
// Tra ve: object payload da duoc validate san sang de tao account.
const collectAdminPayload = async (parsedArgs) => {
  const rl = readline.createInterface({ input, output });

  try {
    const fullName = parsedArgs.fullName || (await promptForValue(rl, "Full name"));
    const email = parsedArgs.email || (await promptForValue(rl, "Email"));
    const phone = parsedArgs.phone ?? (await promptForValue(rl, "Phone number (optional)"));
    const avatarUrl = parsedArgs.avatarUrl ?? (await promptForValue(rl, "Avatar URL (optional)"));
    const dob = parsedArgs.dob || (await promptForValue(rl, "Date of birth (YYYY-MM-DD)"));
    const gender = parsedArgs.gender || (await promptForValue(rl, "Gender", "secret"));
    const password = parsedArgs.password || (await promptForValue(rl, "Password"));

    return validateAdminPayload({
      fullName,
      email,
      phone,
      avatarUrl,
      dob,
      gender,
      password,
    });
  } finally {
    rl.close();
  }
};

// Ham nay dung de tao tai khoan admin truc tiep tu terminal ma khong can giao dien web.
// Nhan vao: khong nhan tham so, script doc flag/prompt roi thao tac DB.
// Tac dong: validate, hash password, INSERT account admin moi va in ket qua ra console.
const main = async () => {
  const parsedArgs = parseArguments(process.argv.slice(2));
  let db = null;

  try {
    if (parsedArgs.help) {
      console.log(HELP_TEXT.trim());
      return;
    }

    db = require("../config/database");
    const accountModel = require("../models/accountModel");
    const passwordUtil = require("../utils/passwordUtil");
    const adminPayload = await collectAdminPayload(parsedArgs);
    const existingEmailAccount = await accountModel.findByEmail(adminPayload.email);

    if (existingEmailAccount) {
      throw new Error("This email is already used by another account.");
    }

    if (adminPayload.phone) {
      const existingPhoneAccount = await accountModel.findByPhone(adminPayload.phone);

      if (existingPhoneAccount) {
        throw new Error("This phone number is already used by another account.");
      }
    }

    const accountId = createUUID();
    const passwordHash = await passwordUtil.hashPassword(adminPayload.password, adminPayload.email);

    await accountModel.createAccount({
      accountId,
      fullName: adminPayload.fullName,
      dob: adminPayload.dob,
      gender: adminPayload.gender,
      email: adminPayload.email,
      phone: adminPayload.phone,
      passwordHash,
      role: "admin",
      status: "active",
      avatarUrl: adminPayload.avatarUrl,
      termsAccepted: true,
    });

    console.log("Admin account created successfully.");
    console.log(`Account ID: ${accountId}`);
    console.log(`Email: ${adminPayload.email}`);
    console.log("Role: admin");
    console.log("Status: active");
  } catch (error) {
    console.error(`Unable to create admin account: ${error.message}`);
    process.exitCode = 1;
  } finally {
    if (db?.end) {
      await db.end();
    }
  }
};

main();
