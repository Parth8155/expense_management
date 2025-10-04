const bcrypt = require('bcrypt');
const User = require('../models/User');
const Company = require('../models/Company');

/**
 * Create a new user
 * @param {Object} userData - User data
 * @param {string} requestingUserId - ID of user making the request
 * @returns {Promise<Object>} Created user
 */
const createUser = async (userData, requestingUserId) => {
  const { email, password, firstName, lastName, role, companyId, managerId } = userData;

  // Validate required fields
  if (!email || !password || !firstName || !lastName || !role || !companyId) {
    throw new Error('Missing required fields: email, password, firstName, lastName, role, companyId');
  }

  // Validate role
  if (!['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(role)) {
    throw new Error('Invalid role. Must be ADMIN, MANAGER, or EMPLOYEE');
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    const error = new Error('User with this email already exists');
    error.code = 'USER_EXISTS';
    throw error;
  }

  // Verify company exists
  const company = await Company.findById(companyId);
  if (!company) {
    throw new Error('Company not found');
  }

  // Verify requesting user is from the same company
  const requestingUser = await User.findById(requestingUserId);
  if (!requestingUser || requestingUser.companyId.toString() !== companyId.toString()) {
    throw new Error('Cannot create user for a different company');
  }

  // If managerId is provided, verify manager exists and is in same company
  if (managerId) {
    const manager = await User.findById(managerId);
    if (!manager) {
      throw new Error('Manager not found');
    }
    if (manager.companyId.toString() !== companyId.toString()) {
      throw new Error('Manager must be in the same company');
    }
    if (manager.role !== 'MANAGER' && manager.role !== 'ADMIN') {
      throw new Error('Assigned manager must have MANAGER or ADMIN role');
    }
  }

  // Hash password
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // Create user
  const user = await User.create({
    companyId,
    email: email.toLowerCase(),
    passwordHash,
    firstName,
    lastName,
    role,
    managerId: managerId || null,
    isActive: true
  });

  return user;
};

/**
 * Get users by company
 * @param {string} companyId - Company ID
 * @param {string} requestingUserId - ID of user making the request
 * @returns {Promise<Array>} List of users
 */
const getUsersByCompany = async (companyId, requestingUserId) => {
  const requestingUser = await User.findById(requestingUserId);
  
  if (!requestingUser) {
    throw new Error('Requesting user not found');
  }

  // Verify requesting user is from the same company
  if (requestingUser.companyId.toString() !== companyId.toString()) {
    throw new Error('Cannot view users from a different company');
  }

  let query = { companyId };

  // If requesting user is a manager (not admin), only show their team members
  if (requestingUser.role === 'MANAGER') {
    query.managerId = requestingUserId;
  }

  const users = await User.find(query)
    .select('-passwordHash')
    .populate('managerId', 'firstName lastName email')
    .populate('companyId', 'name')
    .sort({ createdAt: -1 });

  return users;
};

/**
 * Get team members for a manager
 * @param {string} managerId - Manager ID
 * @returns {Promise<Array>} List of team members
 */
const getTeamMembers = async (managerId) => {
  const manager = await User.findById(managerId);
  
  if (!manager) {
    throw new Error('Manager not found');
  }

  const teamMembers = await User.find({ managerId })
    .select('-passwordHash')
    .populate('companyId', 'name')
    .sort({ createdAt: -1 });

  return teamMembers;
};

/**
 * Get user by ID
 * @param {string} userId - User ID
 * @param {string} requestingUserId - ID of user making the request
 * @returns {Promise<Object>} User object
 */
const getUserById = async (userId, requestingUserId) => {
  const user = await User.findById(userId)
    .select('-passwordHash')
    .populate('managerId', 'firstName lastName email')
    .populate('companyId', 'name country defaultCurrency');

  if (!user) {
    throw new Error('User not found');
  }

  const requestingUser = await User.findById(requestingUserId);
  
  if (!requestingUser) {
    throw new Error('Requesting user not found');
  }

  // Verify requesting user has permission to view this user
  // Admin can view all users in their company
  // Manager can view their team members
  // Employee can only view themselves
  if (requestingUser.role === 'ADMIN') {
    if (requestingUser.companyId.toString() !== user.companyId._id.toString()) {
      throw new Error('Cannot view user from a different company');
    }
  } else if (requestingUser.role === 'MANAGER') {
    if (user.managerId && user.managerId._id.toString() !== requestingUserId.toString() && 
        userId.toString() !== requestingUserId.toString()) {
      throw new Error('Cannot view user outside your team');
    }
  } else {
    if (userId.toString() !== requestingUserId.toString()) {
      throw new Error('Cannot view other users');
    }
  }

  return user;
};

/**
 * Update user
 * @param {string} userId - User ID
 * @param {Object} updates - Fields to update
 * @param {string} requestingUserId - ID of user making the request
 * @returns {Promise<Object>} Updated user
 */
const updateUser = async (userId, updates, requestingUserId) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error('User not found');
  }

  const requestingUser = await User.findById(requestingUserId);
  
  if (!requestingUser) {
    throw new Error('Requesting user not found');
  }

  // Verify requesting user is from the same company
  if (requestingUser.companyId.toString() !== user.companyId.toString()) {
    throw new Error('Cannot update user from a different company');
  }

  // Validate allowed fields
  const allowedFields = ['firstName', 'lastName', 'email', 'managerId', 'role', 'isActive'];
  const updateFields = {};

  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      updateFields[field] = updates[field];
    }
  }

  // If email is being updated, check for duplicates
  if (updateFields.email) {
    updateFields.email = updateFields.email.toLowerCase();
    const existingUser = await User.findOne({ 
      email: updateFields.email,
      _id: { $ne: userId }
    });
    if (existingUser) {
      const error = new Error('User with this email already exists');
      error.code = 'USER_EXISTS';
      throw error;
    }
  }

  // If managerId is being updated, verify manager exists and is in same company
  if (updateFields.managerId) {
    const manager = await User.findById(updateFields.managerId);
    if (!manager) {
      throw new Error('Manager not found');
    }
    if (manager.companyId.toString() !== user.companyId.toString()) {
      throw new Error('Manager must be in the same company');
    }
    if (manager.role !== 'MANAGER' && manager.role !== 'ADMIN') {
      throw new Error('Assigned manager must have MANAGER or ADMIN role');
    }
  }

  // If role is being updated, validate it
  if (updateFields.role && !['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(updateFields.role)) {
    throw new Error('Invalid role. Must be ADMIN, MANAGER, or EMPLOYEE');
  }

  // Update user
  const updatedUser = await User.findByIdAndUpdate(
    userId,
    { $set: updateFields },
    { new: true, runValidators: true }
  )
    .select('-passwordHash')
    .populate('managerId', 'firstName lastName email')
    .populate('companyId', 'name');

  return updatedUser;
};

/**
 * Deactivate user (soft delete)
 * @param {string} userId - User ID
 * @param {string} requestingUserId - ID of user making the request
 * @returns {Promise<Object>} Deactivated user
 */
const deactivateUser = async (userId, requestingUserId) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error('User not found');
  }

  const requestingUser = await User.findById(requestingUserId);
  
  if (!requestingUser) {
    throw new Error('Requesting user not found');
  }

  // Verify requesting user is from the same company
  if (requestingUser.companyId.toString() !== user.companyId.toString()) {
    throw new Error('Cannot deactivate user from a different company');
  }

  // Prevent deactivating yourself
  if (userId.toString() === requestingUserId.toString()) {
    throw new Error('Cannot deactivate your own account');
  }

  // Deactivate user
  user.isActive = false;
  await user.save();

  return user;
};

/**
 * Assign manager to user
 * @param {string} employeeId - Employee ID
 * @param {string} managerId - Manager ID
 * @param {string} requestingUserId - ID of user making the request
 * @returns {Promise<Object>} Updated user
 */
const assignManager = async (employeeId, managerId, requestingUserId) => {
  const employee = await User.findById(employeeId);
  
  if (!employee) {
    throw new Error('Employee not found');
  }

  const manager = await User.findById(managerId);
  
  if (!manager) {
    throw new Error('Manager not found');
  }

  const requestingUser = await User.findById(requestingUserId);
  
  if (!requestingUser) {
    throw new Error('Requesting user not found');
  }

  // Verify all users are from the same company
  if (employee.companyId.toString() !== manager.companyId.toString() ||
      employee.companyId.toString() !== requestingUser.companyId.toString()) {
    throw new Error('All users must be in the same company');
  }

  // Verify manager has appropriate role
  if (manager.role !== 'MANAGER' && manager.role !== 'ADMIN') {
    throw new Error('Assigned manager must have MANAGER or ADMIN role');
  }

  // Update employee's manager
  employee.managerId = managerId;
  await employee.save();

  const updatedEmployee = await User.findById(employeeId)
    .select('-passwordHash')
    .populate('managerId', 'firstName lastName email')
    .populate('companyId', 'name');

  return updatedEmployee;
};

/**
 * Change user role
 * @param {string} userId - User ID
 * @param {string} newRole - New role (ADMIN, MANAGER, EMPLOYEE)
 * @param {string} requestingUserId - ID of user making the request
 * @returns {Promise<Object>} Updated user
 */
const changeRole = async (userId, newRole, requestingUserId) => {
  if (!['ADMIN', 'MANAGER', 'EMPLOYEE'].includes(newRole)) {
    throw new Error('Invalid role. Must be ADMIN, MANAGER, or EMPLOYEE');
  }

  const user = await User.findById(userId);
  
  if (!user) {
    throw new Error('User not found');
  }

  const requestingUser = await User.findById(requestingUserId);
  
  if (!requestingUser) {
    throw new Error('Requesting user not found');
  }

  // Verify requesting user is from the same company
  if (requestingUser.companyId.toString() !== user.companyId.toString()) {
    throw new Error('Cannot change role for user from a different company');
  }

  // Prevent changing your own role
  if (userId.toString() === requestingUserId.toString()) {
    throw new Error('Cannot change your own role');
  }

  // Update role
  user.role = newRole;
  await user.save();

  const updatedUser = await User.findById(userId)
    .select('-passwordHash')
    .populate('managerId', 'firstName lastName email')
    .populate('companyId', 'name');

  return updatedUser;
};

module.exports = {
  createUser,
  getUsersByCompany,
  getTeamMembers,
  getUserById,
  updateUser,
  deactivateUser,
  assignManager,
  changeRole
};
