function validateCreateFollowUp(data) {
    if (!data.notes?.trim()) {
        throw new Error("Notes are required");
    }
    if (!data.followUpDate) {
        throw new Error("Follow-up date is required");
    }

    const followUpDate = new Date(data.followUpDate);
    if (isNaN(followUpDate.getTime())) {
        throw new Error("Invalid follow-up date");
    }

    if (followUpDate > new Date()) {
        throw new Error("Follow-up date cannot be in the future");
    }

    if (data.nextFollowUpDate) {
        const nextFollowUpDate = new Date(data.nextFollowUpDate);
        if (isNaN(nextFollowUpDate.getTime())) {
            throw new Error("Invalid next follow-up date");
        }
    }
}

module.exports = {
    validateCreateFollowUp
};
