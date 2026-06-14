function validateCreateUser(data) {
    if (!data.name?.trim()) {
        throw new Error('Name is required');
    }
    if (!data.email?.trim() || !data.email.includes('@')) {
        throw new Error('Valid email is required');
    }
    if (!data.password || data.password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
    }
    if (!data.role?.trim()) {
        throw new Error('Role is required');
    }
}

function validateUpdateUser(data) {
    if (data.email !== undefined && (!data.email.trim() || !data.email.includes('@'))) {
        throw new Error('Valid email is required');
    }
    if (data.name !== undefined && !data.name.trim()) {
        throw new Error('Name cannot be empty');
    }
}

function validateLogin(email, password) {
    if (!email?.trim() || !email.includes('@')) {
        throw new Error('Valid email is required');
    }
    if (!password) {
        throw new Error('Password is required');
    }
}

function validatePasswordReset(password) {
    if (!password || password.length < 8) {
        throw new Error('Password must be at least 8 characters long');
    }
}

module.exports = {
    validateCreateUser,
    validateUpdateUser,
    validateLogin,
    validatePasswordReset
};
