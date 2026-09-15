const http = require('http');

const request = (path, method = 'GET', body = null, token = null) => {
  return new Promise((resolve, reject) => {
    const url = new URL(`http://localhost:5000${path}`);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(JSON.stringify(body));
    }
    req.end();
  });
};

async function runTests() {
  console.log('==============================================');
  console.log('STARTING INTEGRATION VERIFICATION TEST SUITE');
  console.log('==============================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`[PASS] ${testName}`);
      passed++;
    } else {
      console.error(`[FAIL] ${testName} - ${details}`);
      failed++;
    }
  }

  // 1. Health check
  const health = await request('/api/health');
  assert(health.status === 200 && health.data.status === 'healthy', '1. Server Health Check');

  // 2. Admin Login
  const adminLogin = await request('/api/auth/login', 'POST', {
    email: 'admin@example.com',
    password: 'Admin@123',
  });
  assert(
    adminLogin.status === 200 && adminLogin.data.token && adminLogin.data.user.role === 'admin',
    '2. Admin Login (JWT generated & role verified)'
  );
  const adminToken = adminLogin.data.token;

  // 3. Employee Login
  const empLogin = await request('/api/auth/login', 'POST', {
    email: 'employee1@example.com',
    password: 'Employee@123',
  });
  assert(
    empLogin.status === 200 && empLogin.data.token && empLogin.data.user.role === 'employee',
    '3. Employee Login (JWT generated & role verified)'
  );
  const empToken = empLogin.data.token;

  // 4. Invalid Login Credentials
  const badLogin = await request('/api/auth/login', 'POST', {
    email: 'admin@example.com',
    password: 'WrongPassword',
  });
  assert(badLogin.status === 401, '4. Invalid Credentials Rejected with 401');

  // 5. Admin Dashboard Stats
  const adminStats = await request('/api/dashboard/stats', 'GET', null, adminToken);
  assert(
    adminStats.status === 200 &&
      adminStats.data.role === 'admin' &&
      adminStats.data.stats.totalEmployees >= 3 &&
      adminStats.data.stats.totalTasks >= 10,
    '5. Admin Dashboard Aggregations (Total Employees & Tasks from MongoDB)'
  );

  // 6. Role Enforcement: Employee cannot access /api/employees
  const empAccessAdminApi = await request('/api/employees', 'GET', null, empToken);
  assert(
    empAccessAdminApi.status === 403,
    '6. RBAC Guard: Employee access to /api/employees rejected with 403 Forbidden'
  );

  // 7. Admin can view /api/employees
  const adminGetEmployees = await request('/api/employees', 'GET', null, adminToken);
  assert(
    adminGetEmployees.status === 200 && adminGetEmployees.data.employees.length >= 3,
    '7. Admin Access: /api/employees returns employee list'
  );

  // 8. Admin creates a new employee
  const testEmail = `test_emp_${Date.now()}@example.com`;
  const createEmp = await request('/api/employees', 'POST', {
    name: 'Automation Tester',
    email: testEmail,
    password: 'Password@123',
  }, adminToken);
  assert(
    createEmp.status === 201 && createEmp.data.employee.email === testEmail,
    '8. Admin creates new employee successfully'
  );
  const newEmpId = createEmp.data.employee._id;

  // 9. Duplicate email rejection
  const dupEmp = await request('/api/employees', 'POST', {
    name: 'Duplicate Guy',
    email: testEmail,
    password: 'Password@123',
  }, adminToken);
  assert(dupEmp.status === 409, '9. Duplicate email creation rejected with 409 Conflict');

  // 10. Admin creates a task and assigns to new employee
  const createTask = await request('/api/tasks', 'POST', {
    title: 'Automated CI/CD Pipeline Verification',
    description: 'Verify deployment artifacts and health telemetry.',
    assignedEmployee: newEmpId,
    priority: 'High',
    status: 'Not Started',
  }, adminToken);
  assert(
    createTask.status === 201 && createTask.data.task.title === 'Automated CI/CD Pipeline Verification',
    '10. Admin creates task & assigns to employee (triggers email dispatch)'
  );
  const createdTaskId = createTask.data.task._id;

  // 11. Search & Pagination
  const searchTasks = await request('/api/tasks?search=Automated&page=1&limit=5', 'GET', null, adminToken);
  assert(
    searchTasks.status === 200 &&
      searchTasks.data.tasks.some(t => t.title.includes('Automated')),
    '11. Server-side search & pagination'
  );

  // 12. Login as the newly created employee
  const newEmpLogin = await request('/api/auth/login', 'POST', {
    email: testEmail,
    password: 'Password@123',
  });
  const newEmpToken = newEmpLogin.data.token;

  // 13. Employee views only their assigned tasks
  const myTasks = await request('/api/tasks', 'GET', null, newEmpToken);
  assert(
    myTasks.status === 200 &&
      myTasks.data.tasks.length === 1 &&
      myTasks.data.tasks[0]._id === createdTaskId,
    '12. Employee Data Isolation: Sees strictly their 1 assigned task'
  );

  // 14. Employee updates status to "In Progress"
  const updateStatus = await request(`/api/tasks/${createdTaskId}/status`, 'PUT', {
    status: 'In Progress',
  }, newEmpToken);
  assert(
    updateStatus.status === 200 && updateStatus.data.task.status === 'In Progress',
    '13. Employee updates task status (triggers Admin email dispatch)'
  );

  // 15. Employee 1 tries to update this employee's task -> 403 Forbidden!
  const unauthorizedUpdate = await request(`/api/tasks/${createdTaskId}/status`, 'PUT', {
    status: 'Completed',
  }, empToken);
  assert(
    unauthorizedUpdate.status === 403,
    '14. Cross-Employee Security: Employee cannot modify other employee tasks (403)'
  );

  console.log('\n==============================================');
  console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('==============================================');

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
