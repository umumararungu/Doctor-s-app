require('dotenv').config();
const express = require('express');
const { User, Doctor, Slot, Appointment } = require('./models');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const JWT_SECRET = process.env.JWT_SECRET;

// Authentication middleware
const authenticate = async (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).send('Access denied');

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = await User.findByPk(decoded.id);
    if (!req.user) throw new Error('User not found');
    next();
  } catch (err) {
    res.status(401).send('Invalid token');
  }
};

// Routes
app.post('/api/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const user = await User.create({ name, email, password, role });
    
    // If registering as doctor
    if (role === 'doctor') {
      await Doctor.create({ userId: user.id, specialty: req.body.specialty });
    }
    
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    const accessToken = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '15m' });
    const refreshToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '7d' });
    
    await user.update({ refreshToken });
    res.json({ accessToken, refreshToken });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Doctor slots management
app.get('/api/doctor/slots', authenticate, async (req, res) => {
  if (req.user.role !== 'doctor') return res.status(403).send('Access denied');
  
  const doctor = await Doctor.findOne({ where: { userId: req.user.id } });
  const slots = await Slot.findAll({ where: { doctorId: doctor.id } });
  res.json(slots);
});

app.post('/api/doctor/slots', authenticate, async (req, res) => {
  if (req.user.role !== 'doctor') return res.status(403).send('Access denied');
  
  const doctor = await Doctor.findOne({ where: { userId: req.user.id } });
  const slot = await Slot.create({ ...req.body, doctorId: doctor.id });
  res.json(slot);
});

// Patient appointment booking
app.get('/api/doctors', async (req, res) => {
  const doctors = await Doctor.findAll({
    include: [{
      model: User,
      attributes: ['name', 'email']
    }]
  });
  res.json(doctors);
});

app.post('/api/book', authenticate, async (req, res) => {
  if (req.user.role !== 'patient') return res.status(403).send('Access denied');
  
  const { slotId } = req.body;
  const slot = await Slot.findByPk(slotId);
  
  if (!slot || slot.booked) {
    return res.status(400).json({ error: 'Slot not available' });
  }
  
  await Appointment.create({ patientId: req.user.id, slotId });
  await slot.update({ booked: true });
  res.json({ message: 'Appointment booked' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));