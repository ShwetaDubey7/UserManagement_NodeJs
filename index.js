const express = require('express');
const bodyParser = require('body-parser');
const pool = require('./db');
const bcrypt = require('bcrypt');

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// Register route
app.post('/register', async (req, res) => {
  const { f_name, l_name, email, phone, pass } = req.body;

  try {
      const result = await pool.query(
          `INSERT INTO users (f_name, l_name, email, phone, pass)
          VALUES ($1, $2, $3, $4, $5) RETURNING id, f_name, l_name, email, approved`,
          [f_name, l_name, email, phone, pass]
      );

      const user = result.rows[0];
      res.status(201).send({ 
          message: 'Registration successful, awaiting admin approval.',
          user
      });
  } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
  }
});


//admin approval
app.post('/admin/approve', async (req, res) => {
    const { adminId, userId, approve } = req.body;
    
    try {
      const adminCheck = await pool.query(
        `SELECT role FROM admin WHERE admin_id = $1`,
        [adminId]
    );
    if (adminCheck.rows.length === 0 || adminCheck.rows[0].role !== 'admin') {
        return res.status(403).send('Only admins can approve or deny users.');
    }

      const approvalStatus = approve ? true : false;
      await pool.query(
          `UPDATE users SET approved = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
          [approvalStatus, userId]
      );
      const userResult = await pool.query(
        `SELECT id, f_name, l_name, email, approved FROM users WHERE id = $1`,
        [userId]
    );
    const user = userResult.rows[0];

    // Send email notification (pseudo code)
    // await sendEmailNotification(user.email, approvalStatus ? 'approved' : 'denied');

      res.status(200).send({ 
        message: `Admin registration ${approve ? 'approved' : 'denied'} successfully`,
      user
     });
  } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
  }
});

// Login route
app.post('/login', async (req, res) => {
  const { email, pass } = req.body;

  try {
    // Check user credentials and approval status
    const result = await pool.query(
        `SELECT id, approved FROM users WHERE email = $1 AND pass = $2`,
        [email, pass]
    );

    if (result.rows.length === 0) {
        return res.status(401).send('Invalid credentials');
    }

    const user = result.rows[0];
    if (!user.approved) {
        return res.status(403).send('Your account is awaiting admin approval.');
    }

    // Generate and return a token or session here
    res.status(200).send('Login successful');
} catch (err) {
  console.log(err.message);
  res.status(500).send('Server error');
  }
});

// Route to list all users
app.get('/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users');
    res.status(200).json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching users', error: err });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
