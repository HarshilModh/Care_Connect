// Validation utility functions for frontend forms

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !email.trim()) {
    return "Email is required";
  }
  if (!emailRegex.test(email)) {
    return "Please enter a valid email address";
  }
  return "";
};

export const validatePassword = (password) => {
  if (!password || !password.trim()) {
    return "Password is required";
  }
  if (password.length < 8) {
    return "Password must be at least 8 characters long";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must contain at least one uppercase letter";
  }
  if (!/[a-z]/.test(password)) {
    return "Password must contain at least one lowercase letter";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must contain at least one number";
  }
  if (!/[!@#$%^&*]/.test(password)) {
    return "Password must contain at least one special character (!@#$%^&*)";
  }
  return "";
};

export const validateConfirmPassword = (password, confirmPassword) => {
  if (!confirmPassword || !confirmPassword.trim()) {
    return "Please confirm your password";
  }
  if (password !== confirmPassword) {
    return "Passwords do not match";
  }
  return "";
};

export const validateName = (name, fieldName = "Name") => {
  if (!name || !name.trim()) {
    return `${fieldName} is required`;
  }
  if (name.trim().length < 2) {
    return `${fieldName} must be at least 2 characters long`;
  }
  if (name.trim().length > 50) {
    return `${fieldName} must be at most 50 characters long`;
  }
  if (!/^[a-zA-Z\s'-]+$/.test(name)) {
    return `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`;
  }
  return "";
};

export const validatePhone = (phone) => {
  if (!phone || !phone.trim()) {
    return "";
  }
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  if (!phoneRegex.test(phone)) {
    return "Please enter a valid phone number";
  }
  const digitsOnly = phone.replace(/\D/g, "");
  if (digitsOnly.length < 10) {
    return "Phone number must be at least 10 digits";
  }
  return "";
};

export const validateRequired = (value, fieldName = "Field") => {
  if (!value || (typeof value === "string" && !value.trim())) {
    return `${fieldName} is required`;
  }
  return "";
};

export const validateGroupName = (name) => {
  if (!name || !name.trim()) {
    return "Group name is required";
  }
  if (name.trim().length < 2) {
    return "Group name must be at least 2 characters long";
  }
  if (name.trim().length > 100) {
    return "Group name must be at most 100 characters long";
  }
  return "";
};

export const validateDescription = (
  description,
  maxLength = 500,
  isRequired = false
) => {
  if (isRequired && (!description || !description.trim())) {
    return "Description is required";
  }
  if (description && description.length > maxLength) {
    return `Description must be at most ${maxLength} characters long`;
  }
  return "";
};

export const validateTaskTitle = (title) => {
  if (!title || !title.trim()) {
    return "Task title is required";
  }
  if (title.trim().length < 3) {
    return "Task title must be at least 3 characters long";
  }
  if (title.trim().length > 200) {
    return "Task title must be at most 200 characters long";
  }
  return "";
};

export const validateDate = (date, fieldName = "Date") => {
  if (!date) {
    return `${fieldName} is required`;
  }
  const selectedDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (isNaN(selectedDate.getTime())) {
    return `Please enter a valid ${fieldName.toLowerCase()}`;
  }

  return "";
};

export const validateFutureDate = (date, fieldName = "Date") => {
  const basicError = validateDate(date, fieldName);
  if (basicError) return basicError;

  const selectedDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (selectedDate < today) {
    return `${fieldName} cannot be in the past`;
  }

  return "";
};

export const validateUrl = (url, fieldName = "URL") => {
  if (!url || !url.trim()) {
    return "";
  }
  try {
    new URL(url);
    return "";
  } catch {
    return `Please enter a valid ${fieldName.toLowerCase()}`;
  }
};

export const validateAge = (age) => {
  if (!age) {
    return "Age is required";
  }
  const ageNum = parseInt(age);
  if (isNaN(ageNum) || ageNum < 0 || ageNum > 150) {
    return "Please enter a valid age between 0 and 150";
  }
  return "";
};

export const validateEmergencyContact = (contact) => {
  if (!contact || !contact.trim()) {
    return "Emergency contact is required";
  }
  if (contact.trim().length < 2) {
    return "Emergency contact must be at least 2 characters long";
  }
  return "";
};

// Validate entire form object
export const validateForm = (formData, validationRules) => {
  const errors = {};

  Object.keys(validationRules).forEach((fieldName) => {
    const rules = validationRules[fieldName];
    const value = formData[fieldName];

    for (const rule of rules) {
      const error = rule(value, formData);
      if (error) {
        errors[fieldName] = error;
        break;
      }
    }
  });

  return errors;
};

// Check if form has any errors
export const hasErrors = (errors) => {
  return Object.keys(errors).some((key) => errors[key]);
};
