import bcrypt from "bcryptjs";

const validateUserInput = (email: string, password: string): boolean => {
    return email && password ? true : false;
};

const comparePassword = (password: string, hashedPassword: string): Promise<boolean> => {
    return bcrypt.compare(password, hashedPassword);
};

export {
    validateUserInput,
    comparePassword
};
