// validations/authValidation.js – User Authentication Input Validation
// ---------------------------------------------------------------------
// Validates:
// - Registration: first_name, last_name, email, phone, password, role
// - Login: email (required, valid format), password (required)

const { ALL_ROLES, PUBLIC_REGISTRATION_ROLES } = require('../config/roles');

/**
 * Validates email format using regex
 * @param {string} email
 * @returns {boolean}
 */
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates phone format (7 to 20 digits, allows +, -, spaces, parentheses)
 * @param {string} phone
 * @returns {boolean}
 */
const isValidPhone = (phone) => {
  const phoneRegex = /^[0-9+\-\s()]{7,20}$/;
  return phoneRegex.test(phone);
};

/**
 * Validates registration input data
 * @param {Object} data - Request body
 * @returns {Object} { isValid, errors, normalizedData }
 */
const validateRegistration = (data) => {
  const errors = [];

  const firstName = data.first_name !== undefined ? data.first_name : data.firstName;
  const lastName = data.last_name !== undefined ? data.last_name : data.lastName;
  const email = data.email;
  const phone = data.phone;
  const password = data.password;
  let role = data.role;

  // 1. First name validation
  if (!firstName || typeof firstName !== 'string' || firstName.trim() === '') {
    errors.push('First name is required.');
  }

  // 2. Last name validation
  if (!lastName || typeof lastName !== 'string' || lastName.trim() === '') {
    errors.push('Last name is required.');
  }

  // 3. Email validation
  if (!email || typeof email !== 'string' || email.trim() === '') {
    errors.push('Email is required.');
  } else if (!isValidEmail(email.trim())) {
    errors.push('Please provide a valid email address.');
  }

  // 4. Phone validation (if provided)
  if (phone !== undefined && phone !== null && String(phone).trim() !== '') {
    if (!isValidPhone(String(phone).trim())) {
      errors.push('Please provide a valid phone number.');
    }
  }

  // 5. Password validation (required, minimum 8 characters)
  if (!password || typeof password !== 'string' || password === '') {
    errors.push('Password is required.');
  } else if (password.length < 8) {
    errors.push('Password must be at least 8 characters long.');
  }

  // 6. Role validation & Public Registration Restrictions
  if (!role) {
    // Default to 'customer' if role is omitted
    role = 'customer';
  } else {
    const normalizedRole = String(role).toLowerCase().trim();

    // Check if role is recognized in the system (must be one of the 5 roles)
    if (!ALL_ROLES.includes(normalizedRole)) {
      errors.push(
        `Invalid role. Supported roles are: ${ALL_ROLES.join(', ')}.`
      );
    } else if (!PUBLIC_REGISTRATION_ROLES.includes(normalizedRole)) {
      // Role is valid in the system, but NOT permitted for public registration
      errors.push(
        `Registration for role '${normalizedRole}' is not allowed through public registration. Admin and delivery accounts must be created through an administrative process.`
      );
    } else {
      role = normalizedRole;
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    normalizedData: {
      firstName: firstName ? firstName.trim() : '',
      lastName: lastName ? lastName.trim() : '',
      email: email ? email.toLowerCase().trim() : '',
      phone: phone && String(phone).trim() !== '' ? String(phone).trim() : null,
      password,
      role,
    },
  };
};

/**
 * Validates login input data
 * @param {Object} data - Request body { email, password }
 * @returns {Object} { isValid, errors, normalizedData }
 */
const validateLogin = (data) => {
  const errors = [];
  const email = data.email;
  const password = data.password;

  // 1. Email validation
  if (!email || typeof email !== 'string' || email.trim() === '') {
    errors.push('Email is required.');
  } else if (!isValidEmail(email.trim())) {
    errors.push('Please provide a valid email address.');
  }

  // 2. Password validation
  if (!password || typeof password !== 'string' || password === '') {
    errors.push('Password is required.');
  }

  return {
    isValid: errors.length === 0,
    errors,
    normalizedData: {
      email: email ? email.toLowerCase().trim() : '',
      password: password || '',
    },
  };
};

/**
 * Express middleware for registration input validation
 */
const validateRegistrationMiddleware = (req, res, next) => {
  const { isValid, errors, normalizedData } = validateRegistration(req.body);

  if (!isValid) {
    return res.status(400).json({
      message: errors[0],
      errors,
    });
  }

  // Pass normalized and validated data forward to controller
  req.body = { ...req.body, ...normalizedData };
  next();
};

/**
 * Express middleware for login input validation
 */
const validateLoginMiddleware = (req, res, next) => {
  const { isValid, errors, normalizedData } = validateLogin(req.body);

  if (!isValid) {
    return res.status(400).json({
      message: errors[0],
      errors,
    });
  }

  req.body = { ...req.body, ...normalizedData };
  next();
};

module.exports = {
  validateRegistration,
  validateRegistrationMiddleware,
  validateLogin,
  validateLoginMiddleware,
  isValidEmail,
  isValidPhone,
};
