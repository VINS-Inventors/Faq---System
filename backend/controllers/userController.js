const db = require('../config/db');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await db.User_find();
    res.json(users.map(u => { const { password, ...rest } = u; return rest; }));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await db.User_findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted', user: { _id: deleted._id, email: deleted.email } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};