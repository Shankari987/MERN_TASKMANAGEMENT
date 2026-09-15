const nodemailer = require('nodemailer');

// Configure transporter based on environment variables
const createTransporter = () => {
  const host = process.env.EMAIL_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.EMAIL_PORT, 10) || 587;
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD;

  if (user && pass) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465, // true for 465, false for other ports
      auth: {
        user,
        pass,
      },
    });
  }

  // If no credentials provided, configure simulated transporter
  return null;
};

/**
 * Send notification email to employee when a new task is assigned
 */
const sendTaskAssignmentEmail = async ({
  employeeEmail,
  employeeName,
  taskTitle,
  taskDescription,
  priority,
  status,
  createdDate,
  adminName,
}) => {
  const subject = `New Task Assigned: ${taskTitle} [${priority} Priority]`;
  const formattedDate = new Date(createdDate || Date.now()).toLocaleString();

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
      <div style="background: linear-gradient(135deg, #4f46e5 0%, #3730a3 100%); padding: 20px; border-radius: 6px; text-align: center; color: white;">
        <h2 style="margin: 0; font-size: 22px;">Task Assigned Notification</h2>
        <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;">Xplore Intellects Task Management System</p>
      </div>

      <div style="padding: 20px 0; color: #334155;">
        <p style="font-size: 16px;">Hello <strong>${employeeName}</strong>,</p>
        <p>A new task has been assigned to you by <strong>${adminName || 'System Administrator'}</strong>.</p>

        <div style="background-color: #f8fafc; border-left: 4px solid #4f46e5; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <h3 style="margin: 0 0 10px 0; color: #1e293b; font-size: 18px;">${taskTitle}</h3>
          <p style="margin: 0 0 15px 0; color: #475569; line-height: 1.5;">${taskDescription}</p>
          
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; width: 120px;"><strong>Priority:</strong></td>
              <td style="padding: 6px 0;">
                <span style="display: inline-block; padding: 3px 10px; border-radius: 12px; font-weight: bold; font-size: 12px; background-color: ${
                  priority === 'High' ? '#fee2e2; color: #b91c1c;' : priority === 'Medium' ? '#fef3c7; color: #b45309;' : '#ecfdf5; color: #047857;'
                }">${priority}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;"><strong>Current Status:</strong></td>
              <td style="padding: 6px 0; color: #1e293b;"><strong>${status}</strong></td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;"><strong>Assigned Date:</strong></td>
              <td style="padding: 6px 0; color: #1e293b;">${formattedDate}</td>
            </tr>
          </table>
        </div>

        <p style="font-size: 14px; color: #64748b;">
          Please log into your Employee Dashboard to view task details and update the status as you make progress.
        </p>
      </div>

      <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 12px; color: #94a3b8; text-align: center;">
        <p>This is an automated notification from the Task Management System.</p>
      </div>
    </div>
  `;

  try {
    const transporter = createTransporter();
    if (transporter) {
      const info = await transporter.sendMail({
        from: `"${process.env.APP_NAME || 'Task Management System'}" <${process.env.EMAIL_USER}>`,
        to: employeeEmail,
        subject,
        html: htmlContent,
      });
      console.log(`[EmailService] Task assignment email sent to ${employeeEmail}: ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } else {
      console.log(`[EmailService - Dev Mode] Simulated Task Assignment Email to: ${employeeEmail}`);
      console.log(`[EmailService - Dev Mode] Subject: ${subject}`);
      return { success: true, simulated: true };
    }
  } catch (error) {
    console.error(`[EmailService] Failed to send assignment email: ${error.message}`);
    // Don't throw so caller transaction completes smoothly
    return { success: false, error: error.message };
  }
};

/**
 * Send notification email to admin when an employee updates task status
 */
const sendTaskStatusUpdateEmail = async ({
  adminEmail,
  employeeName,
  taskTitle,
  previousStatus,
  newStatus,
  updatedDate,
}) => {
  const targetAdminEmail = adminEmail || process.env.ADMIN_EMAIL || 'admin@example.com';
  const subject = `Task Status Update: ${taskTitle} -> ${newStatus}`;
  const formattedDate = new Date(updatedDate || Date.now()).toLocaleString();

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
      <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0369a1 100%); padding: 20px; border-radius: 6px; text-align: center; color: white;">
        <h2 style="margin: 0; font-size: 22px;">Task Status Updated</h2>
        <p style="margin: 5px 0 0 0; opacity: 0.9; font-size: 14px;">Employee Activity Alert</p>
      </div>

      <div style="padding: 20px 0; color: #334155;">
        <p style="font-size: 16px;">Hello <strong>Admin</strong>,</p>
        <p>Employee <strong>${employeeName}</strong> has updated the status of a task.</p>

        <div style="background-color: #f8fafc; border-left: 4px solid #0ea5e9; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <h3 style="margin: 0 0 10px 0; color: #1e293b; font-size: 18px;">${taskTitle}</h3>
          
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b; width: 140px;"><strong>Updated By:</strong></td>
              <td style="padding: 6px 0; color: #1e293b;"><strong>${employeeName}</strong></td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;"><strong>Previous Status:</strong></td>
              <td style="padding: 6px 0; color: #64748b; text-decoration: line-through;">${previousStatus}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;"><strong>New Status:</strong></td>
              <td style="padding: 6px 0;">
                <span style="display: inline-block; padding: 3px 10px; border-radius: 12px; font-weight: bold; font-size: 12px; background-color: ${
                  newStatus === 'Completed' ? '#dcfce7; color: #15803d;' : newStatus === 'In Progress' ? '#e0f2fe; color: #0369a1;' : '#fef9c3; color: #a16207;'
                }">${newStatus}</span>
              </td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;"><strong>Updated Time:</strong></td>
              <td style="padding: 6px 0; color: #1e293b;">${formattedDate}</td>
            </tr>
          </table>
        </div>

        <p style="font-size: 14px; color: #64748b;">
          You can inspect this task in your Admin Dashboard under Task Management.
        </p>
      </div>

      <div style="border-top: 1px solid #e2e8f0; padding-top: 15px; font-size: 12px; color: #94a3b8; text-align: center;">
        <p>This is an automated notification from the Task Management System.</p>
      </div>
    </div>
  `;

  try {
    const transporter = createTransporter();
    if (transporter) {
      const info = await transporter.sendMail({
        from: `"${process.env.APP_NAME || 'Task Management System'}" <${process.env.EMAIL_USER}>`,
        to: targetAdminEmail,
        subject,
        html: htmlContent,
      });
      console.log(`[EmailService] Task status update email sent to Admin (${targetAdminEmail}): ${info.messageId}`);
      return { success: true, messageId: info.messageId };
    } else {
      console.log(`[EmailService - Dev Mode] Simulated Task Status Update Email to Admin: ${targetAdminEmail}`);
      console.log(`[EmailService - Dev Mode] Subject: ${subject}`);
      console.log(`[EmailService - Dev Mode] Content: Employee ${employeeName} updated '${taskTitle}' from '${previousStatus}' to '${newStatus}'`);
      return { success: true, simulated: true };
    }
  } catch (error) {
    console.error(`[EmailService] Failed to send status update email: ${error.message}`);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendTaskAssignmentEmail,
  sendTaskStatusUpdateEmail,
};
