function validateCreateLead(data) {
    if (!data.name?.trim()) {
        throw new Error("Lead name is required");
    }
    if (!data.phone?.trim()) {
        throw new Error("Phone number is required");
    }
}

function validateLeadStatus(status, currentStatus) {
    const validTransitions = {
        NEW: ["INTERESTED", "NOT_INTERESTED", "FOLLOW_UP"],
        INTERESTED: ["FOLLOW_UP", "PAYMENT_PENDING", "NOT_INTERESTED"],
        FOLLOW_UP: ["INTERESTED", "PAYMENT_PENDING", "NOT_INTERESTED"],
        PAYMENT_PENDING: ["CONVERTED"],
        CONVERTED: [],
        NOT_INTERESTED: []
    };

    const allowedStatuses = [
        "NEW", "INTERESTED", "NOT_INTERESTED", "FOLLOW_UP", "PAYMENT_PENDING", "CONVERTED"
    ];

    if (!allowedStatuses.includes(status)) {
        throw new Error('Invalid lead status');
    }

    if (currentStatus === 'CONVERTED') {
        throw new Error('Converted leads cannot be modified');
    }

    if (status !== currentStatus) {
        const allowedNext = validTransitions[currentStatus] || [];
        if (!allowedNext.includes(status)) {
            throw new Error(`Invalid status transition from ${currentStatus} to ${status}`);
        }
    }
}

module.exports = {
    validateCreateLead,
    validateLeadStatus
};
