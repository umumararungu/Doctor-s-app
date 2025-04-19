const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');

// Initialize Sequelize
const sequelize = new Sequelize({
    database: process.env.DB_NAME || 'doctor_scheduler',
    username: process.env.DB_USER || 'app_user',
    password: process.env.DB_PASSWORD || 'doctor_user', // Ensure this is a string
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    dialectOptions: {
      ssl: false // Set to true if using cloud PostgreSQL with SSL
    },
    logging: false
  });

// User Model
const User = sequelize.define('User', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: Sequelize.STRING,
    allowNull: false
  },
  email: {
    type: Sequelize.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false
  },
  role: {
    type: Sequelize.ENUM('doctor', 'patient'),
    allowNull: false
  },
  resetToken: {
    type: Sequelize.STRING
  },
  resetTokenExpiry: {
    type: Sequelize.DATE
  },
  refreshToken: {
    type: Sequelize.STRING
  }
}, {
  hooks: {
    beforeCreate: async (user) => {
      user.password = await bcrypt.hash(user.password, 10);
    }
  }
});

// Doctor Model
const Doctor = sequelize.define('Doctor', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  specialty: {
    type: Sequelize.STRING,
    allowNull: false
  },
  userId: {
    type: Sequelize.INTEGER,
    references: {
      model: User,
      key: 'id'
    }
  }
});

// Slot Model
const Slot = sequelize.define('Slot', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  date: {
    type: Sequelize.DATEONLY,
    allowNull: false
  },
  time: {
    type: Sequelize.TIME,
    allowNull: false
  },
  booked: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  },
  doctorId: {
    type: Sequelize.INTEGER,
    references: {
      model: Doctor,
      key: 'id'
    }
  }
});

// Appointment Model
const Appointment = sequelize.define('Appointment', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  patientId: {
    type: Sequelize.INTEGER,
    references: {
      model: User,
      key: 'id'
    }
  },
  slotId: {
    type: Sequelize.INTEGER,
    references: {
      model: Slot,
      key: 'id'
    }
  }
});

// Define relationships
User.hasOne(Doctor);
Doctor.belongsTo(User);
Doctor.hasMany(Slot);
Slot.belongsTo(Doctor);
User.hasMany(Appointment);
Appointment.belongsTo(User);
Slot.hasOne(Appointment);
Appointment.belongsTo(Slot);

// Sync database
sequelize.sync({ alter: true })
  .then(() => console.log('Database synced'))
  .catch(err => console.error('Database sync error:', err));

module.exports = {
  sequelize,
  User,
  Doctor,
  Slot,
  Appointment
};
