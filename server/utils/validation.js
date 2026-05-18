// Validation patterns and functions for student data

const PATTERNS = {
  // Roll number: typically alphanumeric with minimal spaces/special chars
  // Examples: "STU001", "2024-A-001", "sanan"
  rollNumber: /^[a-zA-Z0-9\-_]+$/,

  // Name: letters, spaces, and some common punctuation
  name: /^[a-zA-Z\s\-'.]+$/,

  // Email validation
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
};

function isValidEmail(email) {
  if (!email || typeof email !== 'string') return false;
  return PATTERNS.email.test(email.trim());
}

function containsNumbers(str) {
  return /\d/.test(str);
}

function containsOnlyNumbers(str) {
  return /^\d+$/.test(str);
}

function containsLetters(str) {
  return /[a-zA-Z]/.test(str);
}

function validateName(name) {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Name is required' };
  }

  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return { valid: false, error: 'Name must be at least 2 characters long' };
  }

  if (trimmed.length > 100) {
    return { valid: false, error: 'Name must not exceed 100 characters' };
  }

  if (!PATTERNS.name.test(trimmed)) {
    return { valid: false, error: 'Name can only contain letters, spaces, hyphens, apostrophes, and periods' };
  }

  // Name should primarily contain letters, not numbers
  if (containsOnlyNumbers(trimmed)) {
    return { valid: false, error: 'Name cannot contain only numbers' };
  }

  // If name has too many numbers relative to letters, it's suspicious
  const digitCount = (trimmed.match(/\d/g) || []).length;
  const letterCount = (trimmed.match(/[a-zA-Z]/g) || []).length;
  if (digitCount > letterCount) {
    return { valid: false, error: 'Name should contain primarily letters, not numbers' };
  }

  return { valid: true };
}

function validateRollNumber(rollNumber) {
  if (!rollNumber || typeof rollNumber !== 'string') {
    return { valid: false, error: 'Roll number is required' };
  }

  const trimmed = rollNumber.trim();
  if (trimmed.length < 2) {
    return { valid: false, error: 'Roll number must be at least 2 characters long' };
  }

  if (trimmed.length > 50) {
    return { valid: false, error: 'Roll number must not exceed 50 characters' };
  }

  if (!PATTERNS.rollNumber.test(trimmed)) {
    return { valid: false, error: 'Roll number can only contain letters, numbers, hyphens, and underscores' };
  }

  const hasLetters = containsLetters(trimmed);
  const hasNumbers = containsNumbers(trimmed);

  // Most roll numbers should have at least one number (e.g., STU001, 2024-A-001, etc.)
  // Pure letter strings are likely names and should be rejected
  if (hasLetters && !hasNumbers) {
    return { valid: false, error: 'Roll number must contain at least one digit. It appears to be a person\'s name. Please use a proper roll number format (e.g., STU001, 2024-A-001).' };
  }

  // If it has letters and numbers, ensure it doesn't look like a name pattern
  if (hasLetters && hasNumbers) {
    const letterCount = (trimmed.match(/[a-zA-Z]/g) || []).length;
    const digitCount = (trimmed.match(/\d/g) || []).length;

    // Reject if: more letters than numbers AND starts with capital letter followed by lowercase
    // This catches patterns like "John123", "Mary456", etc.
    if (letterCount >= digitCount && /^[A-Z][a-z]/.test(trimmed)) {
      return { valid: false, error: 'Roll number appears to contain a person\'s name. Please use a proper roll number format (e.g., STU001, CS-2024-042).' };
    }
  }

  return { valid: true };
}

function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }

  const trimmed = email.trim();
  if (!isValidEmail(trimmed)) {
    return { valid: false, error: 'Please provide a valid email address' };
  }

  return { valid: true };
}

function validateClassName(className) {
  if (!className || typeof className !== 'string') {
    return { valid: false, error: 'Class name is required' };
  }

  const trimmed = className.trim();
  if (trimmed.length < 1) {
    return { valid: false, error: 'Class name is required' };
  }

  if (trimmed.length > 50) {
    return { valid: false, error: 'Class name must not exceed 50 characters' };
  }

  return { valid: true };
}

function validateStudentData(data) {
  const errors = {};

  const nameValidation = validateName(data.name);
  if (!nameValidation.valid) {
    errors.name = nameValidation.error;
  }

  const rollNumberValidation = validateRollNumber(data.rollNumber);
  if (!rollNumberValidation.valid) {
    errors.rollNumber = rollNumberValidation.error;
  }

  const emailValidation = validateEmail(data.email);
  if (!emailValidation.valid) {
    errors.email = emailValidation.error;
  }

  const classNameValidation = validateClassName(data.className);
  if (!classNameValidation.valid) {
    errors.className = classNameValidation.error;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

module.exports = {
  validateName,
  validateRollNumber,
  validateEmail,
  validateClassName,
  validateStudentData,
  isValidEmail,
};
