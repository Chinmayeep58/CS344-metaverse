export const generateTeacherCode = (): string => {
    return "TEACH-" + Math.random().toString(16).substring(2, 6).toUpperCase();
};
