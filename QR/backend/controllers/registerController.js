const db = require("../config/db");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const register = async (req, res) => {
  try {
    const {
      emailOrPhone,
      password,
      role,
      fullName,
      dob,
      gender,
      businessName,
      taxId,
      hqAddress,
      industry,
      website,
      supplierType,
      region,
      scale,
      serviceTypes,
    } = req.body;

    const isEmail = emailOrPhone.includes("@");
    const email = isEmail ? emailOrPhone : null;
    const phone = !isEmail ? emailOrPhone : null;

    const [existingUsers] = await db.query(
      "SELECT * FROM accounts WHERE (email = ? AND email IS NOT NULL) OR (phone = ? AND phone IS NOT NULL)",
      [email, phone],
    );
    if (existingUsers.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Account with this email or phone number already exists!",
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const accountId = "acc-" + crypto.randomUUID();
    const userRole = role || "user";

    await db.query(
      "INSERT INTO accounts (account_id, email, phone, password_hash, role) VALUES (?, ?, ?, ?, ?)",
      [accountId, email, phone, hashedPassword, userRole],
    );

    if (userRole === "user") {
      const userId = "usr-" + crypto.randomUUID();
      await db.query(
        "INSERT INTO users (user_id, account_id, full_name, dob, gender) VALUES (?, ?, ?, ?, ?)",
        [userId, accountId, fullName, dob || null, gender || null],
      );
    } else if (userRole === "brand") {
      const brandId = "brd-" + crypto.randomUUID();
      await db.query(
        "INSERT INTO brands (brand_id, account_id, business_name, brand_name, tax_id, headquarters_address, industry, website) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          brandId,
          accountId,
          businessName,
          businessName,
          taxId,
          hqAddress,
          industry,
          website || null,
        ],
      );
    } else if (userRole === "supplier") {
      const supplierId = "sup-" + crypto.randomUUID();
      await db.query(
        "INSERT INTO suppliers (supplier_id, account_id, entity_name, tax_id, supplier_type, operating_region, business_scale, service_types) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          supplierId,
          accountId,
          fullName,
          taxId || null,
          supplierType,
          region,
          scale || null,
          JSON.stringify(serviceTypes || []),
        ],
      );
    }

    res.status(201).json({
      success: true,
      message: "Account created successfully!",
      data: { account_id: accountId, role: userRole },
    });
  } catch (error) {
    console.error("Registration API Error:", error);
    res.status(500).json({ success: false, message: "Internal server error!" });
  }
};

module.exports = { register };
