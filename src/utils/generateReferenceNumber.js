import { Lor } from "../models/lor.model.js";

export const generateReferenceNumber = async (user) => {
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const day = currentDate.getDate().toString().padStart(2, '0');

    // Find the count of existing LOR documents
    const existingCount = await Lor.countDocuments({ status: "approved" });

    // Increment the existingCount by 1
    const nextCount = existingCount + 1;

    // Construct the referenceNumber with a unique identifier
    const referenceNumber = `SXC/${user.department}/Intenship/${year}-${year + 1}/${nextCount}/${day}.${month}.${year}`;

    // Return an object containing both existingCount + 1 and referenceNumber
    return { nextCount, referenceNumber };
};
