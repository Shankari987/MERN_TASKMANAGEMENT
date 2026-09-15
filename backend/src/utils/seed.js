const dotenv = require('dotenv');
const mongoose = require('mongoose');
const User = require('../models/User');
const Task = require('../models/Task');

dotenv.config();

const seedDatabase = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/task_management_db';
    console.log(`[Seed] Connecting to MongoDB: ${mongoURI}`);
    await mongoose.connect(mongoURI);

    console.log('[Seed] Clearing existing Users and Tasks...');
    await Task.deleteMany({});
    await User.deleteMany({});

    console.log('[Seed] Seeding Admin and Employees...');

    // 1. Create Admin Account
    const admin = await User.create({
      name: 'System Administrator',
      email: 'admin@example.com',
      password: 'Admin@123',
      role: 'admin',
      status: 'Active',
    });

    // 2. Create Sample Employees
    const emp1 = await User.create({
      name: 'John Doe',
      email: 'employee1@example.com',
      password: 'Employee@123',
      role: 'employee',
      status: 'Active',
    });

    const emp2 = await User.create({
      name: 'Jane Smith',
      email: 'employee2@example.com',
      password: 'Employee@123',
      role: 'employee',
      status: 'Active',
    });

    const emp3 = await User.create({
      name: 'Alex Johnson',
      email: 'employee3@example.com',
      password: 'Employee@123',
      role: 'employee',
      status: 'Active',
    });

    console.log('[Seed] Seeding sample tasks...');

    // 3. Create Sample Tasks
    const sampleTasks = [
      {
        title: 'Design Authentication & JWT Security Architecture',
        description: 'Design and implement robust JWT authentication flow, token refresh strategy, and bcrypt password hashing for both admin and employee roles.',
        assignedEmployee: emp1._id,
        priority: 'High',
        status: 'Completed',
      },
      {
        title: 'Implement Employee Management REST Endpoints',
        description: 'Create CRUD API routes for administrators to manage employees with validation and role guards.',
        assignedEmployee: emp1._id,
        priority: 'High',
        status: 'In Progress',
      },
      {
        title: 'Configure Nodemailer Email Notification Service',
        description: 'Setup SMTP transport and HTML email templates for task assignment and status updates sent to admin and employees.',
        assignedEmployee: emp2._id,
        priority: 'High',
        status: 'In Progress',
      },
      {
        title: 'Build Responsive Admin Dashboard UI',
        description: 'Implement dark/light slate dashboard with dynamic metrics cards, search input, status filters, and pagination.',
        assignedEmployee: emp2._id,
        priority: 'Medium',
        status: 'Completed',
      },
      {
        title: 'Develop Employee Task Self-Service Portal',
        description: 'Allow employees to log in, view only their assigned tasks, inspect task details, and update status with immediate feedback.',
        assignedEmployee: emp3._id,
        priority: 'Medium',
        status: 'Pending',
      },
      {
        title: 'Database Indexing & Query Optimization',
        description: 'Add compound indexes on Task schema for high-concurrency search and filter performance.',
        assignedEmployee: emp3._id,
        priority: 'Low',
        status: 'Not Started',
      },
      {
        title: 'Client-Side Form Validation & Toast Notifications',
        description: 'Implement robust client-side validation for all forms with responsive error messages and toast alerts.',
        assignedEmployee: emp1._id,
        priority: 'Medium',
        status: 'Not Started',
      },
      {
        title: 'Comprehensive API Integration Testing',
        description: 'Test all endpoints for edge cases: duplicate emails, unauthorized role access, and pagination boundaries.',
        assignedEmployee: emp2._id,
        priority: 'High',
        status: 'Not Started',
      },
      {
        title: 'Production Deployment & Environment Variable Audit',
        description: 'Audit production environment configuration, secure CORS headers, and prepare deployment scripts.',
        assignedEmployee: emp3._id,
        priority: 'Low',
        status: 'Not Started',
      },
      {
        title: 'Write Technical Documentation & Setup Guide',
        description: 'Author comprehensive README with architecture details, installation steps, credentials, and API documentation.',
        assignedEmployee: emp1._id,
        priority: 'Low',
        status: 'Completed',
      },
    ];

    await Task.insertMany(sampleTasks);

    console.log('----------------------------------------------------');
    console.log('[Seed] Database seeded successfully!');
    console.log('----------------------------------------------------');
    console.log('Development Credentials:');
    console.log('1. Admin:');
    console.log('   Email:    admin@example.com');
    console.log('   Password: Admin@123');
    console.log('   Role:     admin');
    console.log('2. Employees:');
    console.log('   Employee 1: employee1@example.com / Employee@123');
    console.log('   Employee 2: employee2@example.com / Employee@123');
    console.log('   Employee 3: employee3@example.com / Employee@123');
    console.log('----------------------------------------------------');

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error(`[Seed Error] Seeding failed: ${error.message}`);
    process.exit(1);
  }
};

seedDatabase();
