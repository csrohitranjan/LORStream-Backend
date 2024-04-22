
export const generateRandomPassword = (length) => {
    try {
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()-_=+";
        let password = "";
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * charset.length);
            password += charset[randomIndex];
        }
        return password;
    } catch (error) {
        console.error("An error occurred while generating the random:", error);
        return null; // Or any other handling you wish to do
    }
};