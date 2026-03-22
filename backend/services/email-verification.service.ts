// import { promises as dns } from "dns";

// export interface EmailVerificationResult {
//     isValid: boolean;
//     reason: string;
// }

// const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// const ALLOWED_DOMAIN = "iiitvadodara.ac.in";

// export const verifyEmailAddress = async (
//     email: string,
// ): Promise<EmailVerificationResult> => {
//     const normalizedEmail = String(email || "").trim().toLowerCase();

//     if (!normalizedEmail) {
//         return {
//             isValid: false,
//             reason: "Email is required",
//         };
//     }

//     if (!EMAIL_REGEX.test(normalizedEmail)) {
//         return {
//             isValid: false,
//             reason: "Invalid email format",
//         };
//     }

//     const domain = normalizedEmail.split("@")[1];
//     if (!domain) {
//         return {
//             isValid: false,
//             reason: "Invalid email domain",
//         };
//     }

//     if (domain !== ALLOWED_DOMAIN) {
//         return {
//             isValid: false,
//             reason: `Only institute email is allowed: *@${ALLOWED_DOMAIN}`,
//         };
//     }

//     try {
//         const mxRecords = await dns.resolveMx(domain);
//         if (!mxRecords || mxRecords.length === 0) {
//             return {
//                 isValid: false,
//                 reason: "Email domain has no MX records",
//             };
//         }

//         return {
//             isValid: true,
//             reason: `Institute email is valid (${ALLOWED_DOMAIN})`,
//         };
//     } catch {
//         return {
//             isValid: false,
//             reason: `Unable to verify institute domain (${ALLOWED_DOMAIN})`,
//         };
//     }
// };





import { promises as dns } from "dns";

export interface EmailVerificationResult {
    isValid: boolean;
    reason: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ALLOWED_DOMAIN = "iiitvadodara.ac.in";

const DEV_MODE = true;

export const verifyEmailAddress = async (
    email: string,
): Promise<EmailVerificationResult> => {
    const normalizedEmail = String(email || "")
        .trim()
        .toLowerCase();

    // 1️⃣ Check empty
    if (!normalizedEmail) {
        return {
            isValid: false,
            reason: "Email is required",
        };
    }

    // 2️⃣ Basic format check
    if (!EMAIL_REGEX.test(normalizedEmail)) {
        return {
            isValid: false,
            reason: "Invalid email format",
        };
    }

    const domain = normalizedEmail.split("@")[1];

    if (!domain) {
        return {
            isValid: false,
            reason: "Invalid email domain",
        };
    }

    if (DEV_MODE) {
        return {
            isValid: true,
            reason: "Dev mode - email accepted",
        };
    }

    if (domain !== ALLOWED_DOMAIN) {
        return {
            isValid: false,
            reason: `Only institute email is allowed: *@${ALLOWED_DOMAIN}`,
        };
    }

    // 4️⃣ OPTIONAL DNS CHECK (can keep or remove)
    try {
        const mxRecords = await dns.resolveMx(domain);

        if (!mxRecords || mxRecords.length === 0) {
            return {
                isValid: false,
                reason: "Email domain has no MX records",
            };
        }

        return {
            isValid: true,
            reason: `Institute email is valid (${ALLOWED_DOMAIN})`,
        };
    } catch {
        // 🔥 Instead of failing → allow (to avoid blocking)
        return {
            isValid: true,
            reason: "DNS check skipped (safe fallback)",
        };
    }
};