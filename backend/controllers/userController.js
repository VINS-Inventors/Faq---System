const db = require('../config/db');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await db.User_find();
    res.json(users.map(u => { const { password, ...rest } = u; return rest; }));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};