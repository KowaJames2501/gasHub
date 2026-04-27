const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const router = express.Router();
const {verifyToken}  = require('./token');
const db = require('./db');
const path = require('path');
const multer = require('multer');
const crypto = require('crypto');
const fs = require('fs');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');


const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
};

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({ storage });


// User registration route
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const [existingUser] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
      const [userResult] = await db.query('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashedPassword]);


    const newUserId = userResult.insertId;

    // 3. Create Notifications
    const welcomeTitle = "Welcome to Gas Hub!";
    const welcomeMsg = `Hello ${name}, your account has been created successfully. Update your profile  First and start exploring our services.`;
    
    const adminTitle = "New User Registration";
    const adminMsg = `New customer ${name} , (${email}) has just joined the platform.`;

    // INSERT FOR THE NEW USER (Role 'ct' for customer)
    await db.query(
      `INSERT INTO notifications (user_id, role, title, message, type) VALUES (?, 'ct', ?, ?, 'success')`,
      [newUserId, welcomeTitle, welcomeMsg]
    );
    
    const ADMIN_ID = 1; // Change this to your actual admin's user_id
    await db.query(
      `INSERT INTO notifications (user_id, role, title, message, type) VALUES (?, 'ad', ?, ?, 'info')`,
      [ADMIN_ID, adminTitle, adminMsg]
    );
    res.status(201).json({
      success: true,
      message: 'User registered successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  } });

// User registration route
router.post('/agentregister', upload.fields([{ name: 'license', maxCount: 1 }, { name: 'id_card', maxCount: 1 }]), async (req, res) => {
  const { businessName, email, phone, address } = req.body;


   const securePassword = crypto.randomBytes(32).toString('hex');
if (!businessName || !email || !phone || !address) {
    return res.status(400).json({ success: false, message: 'Please fill all required fields' });
  }

  // Get file paths
  const licensePath = req.files['license'] ? `/uploads/agents/${req.files['license'][0].filename}` : null;
  const idPath = req.files['id_card'] ? `/uploads/agents/${req.files['id_card'][0].filename}` : null;

  try {
    const [existingUser] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

      const [userResult] = await db.query('INSERT INTO users (name, email, phone,password, role,location) VALUES (?, ?, ?, ?, ?, ?)', [businessName, email, phone, securePassword, 'inactive', address]);

      const [agentResult] = await db.query('INSERT INTO storage (user_id,business_license, national_id) VALUES (?, ?, ?)', [userResult.insertId, licensePath, idPath]);
    const newUserId = userResult.insertId;

// 3. INTERNAL EMAIL HANDLING (Transporter created inside the route)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS 
      }
    });

    const mailOptions = {
      from: '"Gas Hub System" <' + process.env.EMAIL_USER + '>',
      to: email,
      subject: 'Gas Hub | Agent Application Received',
html: `
  <div style="background-color: #09090B; color: #FFFFFF; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: auto; padding: 40px 20px; border-radius: 24px; border: 1px solid #27272A; text-align: center;">
    
    <h2 style="color: #FF9500; font-size: 24px; font-weight: 900; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px;">
      Welcome to Gas Hub
    </h2>
    <p style="color: #A1A1AA; font-size: 14px; line-height: 1.5; margin-bottom: 30px;">
      Your agent profile for <b style="color: #FFFFFF;">${businessName}</b> has been successfully created and is currently <span style="color: #FF9500;">pending approval</span>.
    </p>

    <div style="background-color: #18181B; padding: 25px; border-radius: 16px; border: 1px dashed #3F3F46; margin-bottom: 30px;">
      <p style="margin: 0; font-size: 12px; color: #71717A; text-transform: uppercase; font-weight: 800; letter-spacing: 1px;">
        Activation Fee Required
      </p>
      <p style="margin: 10px 0; font-size: 22px; font-weight: 900; color: #FFFFFF;">
        Tsh. 50,000/=
      </p>
      <div style="background-color: #09090B; padding: 10px; border-radius: 8px; margin-top: 10px;">
        <p style="margin: 0; font-family: monospace; font-size: 16px; color: #FF9500; font-weight: bold;">
          Merchant: 50853038
        </p>
        <p style="margin: 5px 0 0; font-size: 13px; color: #71717A;">
          Name: <span style="color: #FFFFFF;">LIPA PMP</span>
        </p>
      </div>
    </div>

    <div style="border-top: 1px solid #27272A; pt: 20px; padding-top: 20px;">
      <p style="font-size: 12px; color: #71717A; font-weight: 600; margin-bottom: 15px;">
        CONTACT ADMIN TO ACTIVATE ACCOUNT
      </p>
      <div style="display: inline-block; text-align: left;">
        <p style="font-size: 13px; color: #A1A1AA; margin: 4px 0;">
          <strong style="color: #FF9500;">Phone:</strong> +255 620 707 534
        </p>
        <p style="font-size: 13px; color: #A1A1AA; margin: 4px 0;">
          <strong style="color: #FF9500;">Email:</strong> admin@gashub.com
        </p>
      </div>
    </div>

    <p style="font-size: 10px; color: #3F3F46; margin-top: 40px; text-transform: uppercase;">
      Gas Hub Industrial Systems © 2026
    </p>
  </div>
`
    };

    // Send and finish
    await transporter.sendMail(mailOptions);

    // 3. Create Notifications
    const welcomeTitle = "Welcome to Gas Hub!";
    const welcomeMsg = `Hello ${businessName}, your agent account has been created successfully. Update your profile  First and start exploring & providing services.`;
    
    const adminTitle = "New User Registration";
    const adminMsg = `New agent ${businessName} , (${email}) has just joined the platform.`;

   
    await db.query(
      `INSERT INTO notifications (user_id, role, title, message, type) VALUES (?, 'ct', ?, ?, 'success')`,
      [newUserId, welcomeTitle, welcomeMsg]
    );
    
    const ADMIN_ID = 1; 
    await db.query(
      `INSERT INTO notifications (user_id, role, title, message, type) VALUES (?, 'ad', ?, ?, 'info')`,
      [ADMIN_ID, adminTitle, adminMsg]
    );
    res.status(201).json({
      success: true,
      message: 'Application submitted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  } });


  // User login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    
    if (users.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }
    const token = jwt.sign({ id: user.id, email: user.email , role: user.role, location: user.location }, process.env.JWT_SECRET,{expiresIn: '24h' },
    );
    delete user.password,

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});


// 1. SEND OTP
router.post('/sendOTP', async (req, res) => {
  const { email } = req.body;

  try {
    const [user] = await db.execute('SELECT id FROM users WHERE email = ?', [email]);
    if (user.length === 0) {
      return res.status(404).json({ message: 'No account found with this email' });
    }

    const otp = Math.floor(10000 + Math.random() * 90000).toString();
    const expires = new Date(Date.now() + 10 * 60000);

    await db.execute(
      'UPDATE users SET otp_code = ?, otp_expiry = ? WHERE email = ?',
      [otp, expires, email]
    );

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS 
      }
    });

    await transporter.sendMail({
      from: '"Gas Hub System" <' + process.env.EMAIL_USER + '>',
      to: email,
      subject: 'Password Reset Verification Code',
      html: `
  <div style="background-color: #09090B; color: #FFFFFF; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 500px; margin: auto; padding: 40px 20px; border-radius: 24px; border: 1px solid #27272A; text-align: center;">
    
    <div style="margin-bottom: 20px;">
      <div style="display: inline-block; padding: 15px; background-color: #18181B; border-radius: 20px; border: 1px solid #27272A;">
        <span style="font-size: 30px;">🔐</span>
      </div>
    </div>

    <h2 style="color: #FF9500; font-size: 24px; font-weight: 900; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 1px;">
      Verification Code
    </h2>
    <p style="color: #A1A1AA; font-size: 14px; line-height: 1.5; margin-bottom: 30px;">
      A password reset was requested for your <b style="color: #FFFFFF;">Gas Hub</b> agent portal. Use the high-security code below to proceed.
    </p>

    <div style="background-color: #18181B; padding: 30px; border-radius: 20px; border: 1px dashed #FF9500; margin-bottom: 30px;">
      <p style="margin: 0; font-size: 12px; color: #71717A; text-transform: uppercase; font-weight: 800; letter-spacing: 2px;">
        Your OTP Code
      </p>
      <p style="margin: 15px 0; font-size: 38px; font-weight: 900; color: #FFFFFF; letter-spacing: 8px; font-family: 'Courier New', Courier, monospace;">
        ${otp}
      </p>
      <div style="background-color: #09090B; padding: 10px; border-radius: 10px; margin-top: 5px;">
        <p style="margin: 0; font-size: 13px; color: #FF9500; font-weight: bold;">
          Expires in 10 Minutes
        </p>
      </div>
    </div>

    <div style="border-top: 1px solid #27272A; padding-top: 25px;">
      <p style="font-size: 11px; color: #71717A; font-weight: 600; margin-bottom: 15px; text-transform: uppercase;">
        Security Notice
      </p>
      <p style="font-size: 12px; color: #52525B; margin: 0; line-height: 1.6;">
        If you did not request this code, your account security may be compromised. Please contact the administrator immediately.
      </p>
      <p style="font-size: 13px; color: #A1A1AA; margin: 15px 0 0;">
        <strong style="color: #FF9500;">Support:</strong> +255 620 707 534
      </p>
    </div>

    <p style="font-size: 10px; color: #3F3F46; margin-top: 40px; text-transform: uppercase; letter-spacing: 1px;">
      Gas Hub Industrial Systems © 2026
    </p>
  </div>
`
    });

    res.status(200).json({ message: 'OTP sent successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error during OTP request', error: error.message });
  }
});


router.post('/verifyOTP', async (req, res) => {
  const { email, otp } = req.body;

  try {
    const [user] = await db.execute(
      'SELECT id FROM users WHERE email = ? AND otp_code = ? AND otp_expiry > NOW()',
      [email, otp]
    );

    if (user.length === 0) {
      return res.status(400).json({ message: 'Invalid or expired OTP' });
    }

    res.status(200).json({ message: 'OTP verified' });
  } catch (error) {
    res.status(500).json({ message: 'Verification error', error: error.message });
  }
});

router.post('/newPassword', async (req, res) => {
  const { email, password } = req.body;

  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const [result] = await db.execute(
      'UPDATE users SET password = ?, otp_code = NULL, otp_expiry = NULL WHERE email = ?',
      [hashedPassword, email]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User update failed' });
    }

    res.status(200).json({ message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Update failed', error: error.message });
  }
});

router.get('/profile', verifyToken, async (req, res) => {

  const id = req.user.id;
  try {
    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    
    if (users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    res.status(200).json({
      success: true,
      user: users[0]
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: 'Server error' 
    });
  }
});


router.get('/paymentdetails/:agentId', verifyToken, async (req, res) => {
  const { agentId } = req.params;

  try {
    const [details] = await db.query(
      'SELECT provider_name as providerName, account_name as accountName, account_number as accountNumber FROM payment_details WHERE user_id = ?',
      [agentId]
    );

    if (details.length === 0) {
      return res.status(404).json({ success: false, message: 'Agent has no payment details set.' });
    }

    res.status(200).json({
      success: true,
      details: details[0]
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.put('/updateprofile', verifyToken, async (req, res) => {
  const id = req.user.id;
  const { name, email, phone, location } = req.body;

  try {
    const [users] = await db.query('SELECT * FROM users WHERE id = ?', [id]);
    
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    const [userResult] = await db.query('UPDATE users SET name = ?, email = ?, phone = ?, location = ? WHERE id = ?',[name, email, phone, location, id]);
    const profileupdateTitle = "Profile Updated";
    const profileupdateMsg = `Hello ${name}, your profile has been updated successfully.`;
    
    await db.query(
      `INSERT INTO notifications (user_id, role, title, message, type) VALUES (?, 'ct', ?, ?, 'success')`,
      [id, profileupdateTitle, profileupdateMsg]
    );

    res.status(200).json({ 
      success: true, 
      message: 'Profile updated successfully' 
      
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      success: false, 
      message: error,
    });
  }
});

router.post('/updatephoto', verifyToken, upload.single('photo'), async (req, res) => {
  const userId = req.user.id;
  const { removePhoto } = req.body;
  try {
    const file = req.file;
    let photoPath = null;

    if (file) {
      photoPath = `/uploads/${file.filename}`;
    }

    const [results] = await db.query('UPDATE users SET photo_url = ? WHERE id = ?', [photoPath, userId]);
    if (results.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.status(200).json({ 
      success: true, 
      message: file ? 'Photo updated successfully' : 'Photo removed successfully',
      user: { photo_url: photoPath } 
    });
  } catch (error) {
    console.error("Photo Update Error:", error);
    res.status(500).json({ success: false, message: "Failed to process photo" });
  }
});

router.get('/getagents', verifyToken, async (req, res) => {
  try {

    const [agents] = await db.query(
      'SELECT id, name, email,phone, location, "online" as status FROM users WHERE role = "ag"'
    );

    // 2. Fetch all stock items
    const [allStock] = await db.query('SELECT * FROM stock');
    const agentsWithStock = agents.map(agent => {
      const agentProducts = allStock
        .filter(item => item.user_id === agent.id)
        .map(item => ({
          id: item.id,
          name: `${item.size} ${item.jina_la_mtungi}`, 
          stock: item.quantity,   
          price: item.price,
          size: item.size,
          phone: item.phone,
          photo_url: item.photo_url,                  
          icon: 'gas-cylinder'                      
        }));

      return {
        ...agent,
        products: agentProducts.length > 0 ? agentProducts : null 
      };
    });
    res.status(200).json({ 
      success: true, 
      agents: agentsWithStock 
    });

  } catch (error) {
    console.error("Database Error:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.get('/getsuppliers', verifyToken, async (req, res) => {
  try {

    const [suppliers] = await db.query(
      'SELECT id, name, email,phone, location, "online" as status FROM users WHERE role = "sp"'
    );

    // 2. Fetch all stock items
    const [allStock] = await db.query('SELECT * FROM stock');
    const suppliersWithStock = suppliers.map(supplier => {
      const supplierProducts = allStock
        .filter(item => item.user_id === supplier.id)
        .map(item => ({
          id: item.id,
          name: `${item.size} ${item.jina_la_mtungi}`, 
          stock: item.quantity,   
          price: item.price,
          size: item.size,
          phone: item.phone,
          photo_url: item.photo_url,                  
          icon: 'gas-cylinder'                      
        }));

      return {
        ...supplier,
        products: supplierProducts.length > 0 ? supplierProducts  : null 
      };
    });
    res.status(200).json({ 
      success: true, 
      suppliers: suppliersWithStock 
    });
  } catch (error) {
    console.error("Database Error:", error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});



router.post('/placeorder', verifyToken, async (req, res) => {
  const customer_id = req.user.id;
  const { agent_id, items, total, payment_method, payment_phone } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Cart is empty' });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Insert into orders table 
    const [orderResult] = await connection.query(
      'INSERT INTO orders (customer_id, agent_id, total_amount, status, payment_method, transaction_ref) VALUES (?, ?, ?, ?, ?, ?)',
      [customer_id, agent_id, total, 'pending', payment_method, payment_phone || null]
    );

    const orderId = orderResult.insertId;

    // 2. Insert order items
    const itemValues = items.map(item => [orderId, item.id, item.qty]);
    await connection.query('INSERT INTO order_items (order_id, stock_id, quantity) VALUES ?', [itemValues]);

    // --- 3. NOTIFICATIONS UPDATE ---
    
    // A: Customer Notification (Role: 'ct')
    const customerTitle = "Order Received";
    const customerMsg = `Order  has been placed successfully for ${total}.`;
    await connection.query(
      `INSERT INTO notifications (user_id, role, title, message, type) VALUES (?, 'ct', ?, ?, 'success')`,
      [customer_id, customerTitle, customerMsg]
    );

    // B: Agent Notification (Role: 'ag')
    const agentTitle = "New Order Alert";
    const agentMsg = `You have received a new order. Open to view details.`;
    await connection.query(
      `INSERT INTO notifications (user_id, role, title, message, type) VALUES (?, 'ag', ?, ?, 'warning')`,
      [agent_id, agentTitle, agentMsg]
    );

    // Finalize everything
    await connection.commit();
    connection.release();

    res.status(201).json({ 
      success: true, 
      message: 'Order placed successfully',
      orderId: orderId
    });

  } catch (error) {
    await connection.rollback();
    connection.release();

    console.error("Order Error:", error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process order',
      error: error.message 
    });
  }
});


router.post('/agentplaceorder', verifyToken, async (req, res) => {
  const agent_id = req.user.id;
  const { supplier_id, items, total, payment_method, payment_phone } = req.body;

  if (!items || items.length === 0) {
    return res.status(400).json({ success: false, message: 'Cart is empty' });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // 1. Insert into orders table 
    const [orderResult] = await connection.query(
      'INSERT INTO orders (customer_id, agent_id, total_amount, status, payment_method, transaction_ref) VALUES (?, ?, ?, ?, ?, ?)',
      [agent_id, supplier_id, total, 'pending', payment_method, payment_phone || null]
    );

    const orderId = orderResult.insertId;

    // 2. Insert order items
    const itemValues = items.map(item => [orderId, item.id, item.qty]);
    await connection.query('INSERT INTO order_items (order_id, stock_id, quantity) VALUES ?', [itemValues]);

    // --- 3. NOTIFICATIONS UPDATE ---
    
    // A: Customer Notification (Role: 'ct')
    const agentTitle = "Order Received";
    const agentMsg = `Order  has been placed successfully for ${total}.`;
    await connection.query(
      `INSERT INTO notifications (user_id, role, title, message, type) VALUES (?, 'ag', ?, ?, 'success')`,
      [agent_id, agentTitle, agentMsg]
    );

    // B: Agent Notification (Role: 'ag')
    const supplierTitle = "New Order Alert";
    const supplierMsg = `You have received a new order. Open to view details.`;
    await connection.query(
      `INSERT INTO notifications (user_id, role, title, message, type) VALUES (?, 'sp', ?, ?, 'warning')`,
      [supplier_id, supplierTitle, supplierMsg]
    );

    // Finalize everything
    await connection.commit();
    connection.release();

    res.status(201).json({ 
      success: true, 
      message: 'Order placed successfully',
      orderId: orderId
    });

  } catch (error) {
    await connection.rollback();
    connection.release();

    console.error("Order Error:", error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process order',
      error: error.message 
    });
  }
});

router.get('/myorder', verifyToken, async (req, res) => {
  const customer_id = req.user.id;

  try {
    const query = `
      SELECT 
        o.id, 
        o.total_amount, 
        o.status, 
        o.payment_method, 
        o.transaction_ref, 
        o.created_at,
        u.name as agent_name
      FROM orders o
      LEFT JOIN users u ON o.agent_id = u.id
      WHERE o.customer_id = ? AND o.show_to_customer = 1
      ORDER BY o.created_at DESC
    `;

    const [orders] = await db.query(query, [customer_id]);

    res.json({
      success: true,
      orders: orders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
});


router.get('/myorders', verifyToken, async (req, res) => {
  const customer_id = req.user.id;

  try {
    const query = `
      SELECT 
        o.id, 
        o.total_amount, 
        o.status, 
        o.payment_method, 
        o.transaction_ref, 
        o.created_at,
        u.name as agent_name
      FROM orders o
      LEFT JOIN users u ON o.agent_id = u.id
      WHERE o.customer_id = ?
      ORDER BY o.created_at DESC
    `;

    const [orders] = await db.query(query, [customer_id]);

    res.json({
      success: true,
      orders: orders
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch orders' });
  }
});

router.get('/getagentorders', verifyToken, async (req, res) => {
  const agentId = req.user.id; // Logged in agent ID from token

  try {
    const query = `
      SELECT 
        o.id, 
        o.total_amount, 
        o.status, 
        o.payment_method, 
        o.transaction_ref,
        o.created_at,
        u.name AS customer_name,
        u.phone AS customer_phone,
        u.photo_url AS customer_photo,
        u.location AS customer_location,
        oi.quantity AS quantity,
        s.jina_la_mtungi,
        s.size,
        s.price,
        s.photo_url AS product_photo
      FROM orders o
      INNER JOIN users u ON o.customer_id = u.id
      INNER JOIN order_items oi ON o.id = oi.order_id
      INNER JOIN stock s ON oi.stock_id = s.id
      WHERE o.agent_id = ?
      ORDER BY o.created_at DESC
    `;

    const [orders] = await db.query(query, [agentId]);

    res.json({
      success: true,
      orders: orders
    });
  } catch (error) {
    console.error("Fetch Orders Error:", error);
    res.status(500).json({ success: false, message: 'Server error fetching orders' });
  }
});


router.put('/resolveorder', verifyToken, async (req, res) => {
  const { orderId, status } = req.body;
  const agentId = req.user.id;

  const allowedStatuses = ['pending', 'processing', 'completed', 'cancelled'];
  if (!allowedStatuses.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status requested.' });
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [orderData] = await connection.query(
      'SELECT status FROM orders WHERE id = ? AND agent_id = ?',
      [orderId, agentId]
    );

    if (orderData.length === 0) {
      await connection.rollback();
      return res.status(403).json({ success: false, message: 'Unauthorized: Access Denied.' });
    }

    const currentStatus = orderData[0].status;

    if (status === 'completed' && currentStatus !== 'completed') {
      
      const [items] = await connection.query(
        'SELECT stock_id, quantity FROM order_items WHERE order_id = ?',
        [orderId]
      );

      for (const item of items) {
        const [stockRecord] = await connection.query(
          'SELECT quantity, jina_la_mtungi FROM stock WHERE id = ? FOR UPDATE',
          [item.stock_id]
        );

        if (stockRecord.length === 0) {
          throw new Error(`Product not found for stock ID: ${item.stock_id}`);
        }

        if (stockRecord[0].quantity < item.quantity) {
          throw new Error(`Insufficient stock for ${stockRecord[0].jina_la_mtungi}. Available: ${stockRecord[0].quantity}`);
        }

        await connection.query(
          'UPDATE stock SET quantity = quantity - ? WHERE id = ?',
          [item.quantity, item.stock_id]
        );
      }
    }

    await connection.query(
      'UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [status, orderId]
    );

    await connection.commit();
    res.json({ 
      success: true, 
      message: `Order #${orderId} marked as ${status}. Inventory adjusted.` 
    });

  } catch (error) {
    await connection.rollback();
    console.error('Order Resolution Error:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message || 'An error occurred while processing the order.' 
    });
  } finally {
    connection.release();
  }
});

router.post('/cancelorder/:id', verifyToken, async (req, res) => {
  const orderId = req.params.id;
  const customer_id = req.user.id;

  try {
    const [order] = await db.query(
      'SELECT agent_id FROM orders WHERE id = ? AND customer_id = ? AND status = "pending"',
      [orderId, customer_id]
    );

    if (order.length === 0) {
      return res.status(400).json({ success: false, message: 'Order cannot be cancelled' });
    }

    const agentId = order[0].agent_id;

    // 2. Update order status
    const [result] = await db.query(
      'UPDATE orders SET status = "cancelled" WHERE id = ? AND customer_id = ?',
      [orderId, customer_id]
    );

    if (result.affectedRows > 0) {
      // --- 3. NOTIFICATIONS ---

      // To Customer: Confirmation of cancellation
      await db.query(
        `INSERT INTO notifications (user_id, role, title, message, type) 
         VALUES (?, 'ct', 'Order Cancelled', ?, 'info')`,
        [customer_id, `Your order has been successfully cancelled.`]
      );

      // To Agent: Alert that the order is gone
      await db.query(
        `INSERT INTO notifications (user_id, role, title, message, type, reference_id) 
         VALUES (?, 'ag', 'Order Cancelled by Customer', ?, 'error', ?)`,
        [agentId, `Customer has cancelled order #${orderId}. Do not process this delivery.`, orderId]
      );

      res.json({ success: true, message: 'Order cancelled' });
    } else {
      res.status(400).json({ success: false, message: 'Update failed' });
    }
  } catch (error) {
    console.error("Cancel Error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
});


router.post('/clear-order-history', verifyToken, async (req, res) => {
  const customer_id = req.user.id;
  try {

    await db.query('UPDATE orders SET show_to_customer = 0 WHERE customer_id = ?', [customer_id]);
    res.json({ success: true, message: 'History cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to clear history' });
  }
});


router.put('/changepassword', verifyToken, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user.id; // Extracted from JWT

  // 1. Basic Validation
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ success: false, message: "Missing fields" });
  }

  if (newPassword.length < 5) {
    return res.status(400).json({ success: false, message: "New password too short" });
  }

  try {
    // 2. Fetch user from DB to get the current hashed password
    const [users] = await db.query('SELECT password FROM users WHERE id = ?', [userId]);
    
    if (users.length === 0) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const user = users[0];

    // 3. Compare Old Password with DB Hash
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Current password incorrect" });
    }

    // 4. Hash the New Password
    const salt = await bcrypt.genSalt(10);
    const hashedNewPassword = await bcrypt.hash(newPassword, salt);

    // 5. Update Database
    await db.query('UPDATE users SET password = ? WHERE id = ?', [hashedNewPassword, userId]);

    res.json({ success: true, message: "Password updated successfully" });

  } catch (error) {
    console.error("Password Change Error:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
});


router.delete('/deleteaccount', verifyToken, async (req, res) => {
  try {
    const passsword = req.body.password;
    const userId = req.user.id;

    // 1. Fetch user details first so we can tell the admin who left
    const [user] = await db.query('SELECT * FROM users WHERE id = ?', [userId]);

     if (user.length === 0) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const isMatch = await bcrypt.compare(passsword, user[0].password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Password incorrect" });
    }else{    
    const { name, email } = user[0];

    const [admin] = await db.query('SELECT id FROM users WHERE role = "ad" LIMIT 1');
     const adminId = admin[0].id; 
    const adminTitle = "Account Deleted";
    const adminMsg = `User ${name} (${email}) has deleted their account and left Gas Hub.`;

    await db.query(
      `INSERT INTO notifications (user_id, role, title, message, type) VALUES (?, 'ad', ?, ?, 'warning')`,
      [adminId, adminTitle, adminMsg]
    );
    await db.query('DELETE FROM users WHERE id = ?', [userId]);

    res.json({ success: true, message: "Account deleted." });
  }
  } catch (error) {
    console.error("Deletion Error:", error);
    res.status(500).json({ success: false, message: "Account Deletion failed." });
  }
});

router.delete('/wipeorders', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    await db.query('DELETE FROM orders WHERE customer_id = ?  AND status = ?', [userId, 'completed']);
    res.json({ success: true, message: "Order history wiped completely." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Order Deletion failed." });
  }
});

router.delete('/deletenotifications/:id', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    await db.query('DELETE FROM notifications WHERE id = ? AND user_id = ?', [id, userId]);
    res.json({ success: true, message: "Notification deleted." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Notification Deletion failed." });
  }
});

router.put('/readallnotifications', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    await db.query('UPDATE notifications SET is_read = 1 WHERE user_id = ?', [userId]);
    res.json({ success: true, message: "All notifications marked as read." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Notifications mark as read failed." });
  }
});

router.put('/notifications/:id', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    await db.query('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?', [id, userId]);
    res.json({ success: true, message: "Notification marked as read." });
  } catch (error) {
    res.status(500).json({ success: false, message: "Notification to mark as read failed." });
  }
});

router.get('/notifications', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [notifications] = await db.query(
      `SELECT * FROM notifications 
       WHERE user_id = ? AND is_deleted = FALSE
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json({
      success: true,
      count: notifications.length,
      notifications
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notifications"
    });
  }
});


// --- GET CURRENT PAYMENT DETAILS ---
router.get('/getPaymentDetails', verifyToken, async (req, res) => {
  const userId = req.user.id;

  try {
    const [details] = await db.execute(
      'SELECT provider_name, account_name, account_number FROM payment_details WHERE user_id = ? AND is_active = 1 LIMIT 1',
      [userId]
    );

    if (details.length === 0) {
      return res.status(200).json(null); 
    }

    res.status(200).json(details[0]);
  } catch (error) {
    res.status(500).json({ message: 'Internal Server Error', error: error.message });
  }
});


router.post('/updatePaymentDetails', verifyToken, async (req, res) => {
  const { provider, accountName, accountNumber } = req.body;
  const userId = req.user.id;

  if (!provider || !accountName || !accountNumber) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const [existing] = await db.execute(
      'SELECT id FROM payment_details WHERE user_id = ?',
      [userId]
    );

    if (existing.length > 0) {
      await db.execute(
        'UPDATE payment_details SET provider_name = ?, account_name = ?, account_number = ? WHERE user_id = ?',
        [provider, accountName, accountNumber, userId]
      );
    } else {
      await db.execute(
        'INSERT INTO payment_details (user_id, provider_name, account_name, account_number) VALUES (?, ?, ?, ?)',
        [userId, provider, accountName, accountNumber]
      );
    }

    res.status(200).json({ success: true, message: 'Payment details synced successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to sync payment data', error: error.message });
  }
});

router.post('/addStock', verifyToken, async (req, res) => {
  const { jina_la_mtungi, quantity, size, price, photo_url } = req.body;
  const userId = req.user.id;

  try {
    const [result] = await db.execute(
      `INSERT INTO stock (user_id, jina_la_mtungi, quantity, size, price, photo_url) 
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, jina_la_mtungi, quantity, size, price, photo_url]
    );
    res.status(201).json({ success: true, insertId: result.insertId });
  } catch (error) {
    res.status(500).json({ message: 'Error adding stock', error: error.message });
  }
});

router.get('/getMyStock', verifyToken, async (req, res) => {
  const userId = req.user.id; 

  try {
    const [rows] = await db.execute(`SELECT * FROM stock WHERE user_id = ? ORDER BY updated_at DESC`,[userId]);

    res.status(200).json(rows);
  } catch (error) {
    console.error('Error fetching stock:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve stock inventory', 
      error: error.message 
    });
  }
});

router.put('/updateStock/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const updates = req.body; 
  const field = Object.keys(updates)[0];
  const value = Object.values(updates)[0];

  try {
    await db.execute(
      `UPDATE stock SET ${field} = ? WHERE id = ? AND user_id = ?`,
      [value, id, req.user.id]
    );
    res.sendStatus(200);
  } catch (err) {
    res.status(500).json(err);
  }
});

module.exports = router;