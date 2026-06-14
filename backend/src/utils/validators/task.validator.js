function validateCreateTask(data) {
    if (!data.title?.trim()) {
        throw new Error("Task title is required");
    }
    if (!data.assignedTo) {
        throw new Error("Assigned user is required");
    }
    if (!data.dueDate) {
        throw new Error("Due date is mandatory");
    }

    const dueDate = new Date(data.dueDate);
    if (isNaN(dueDate.getTime())) {
        throw new Error("Invalid due date");
    }
}

function validateTaskStatus(status) {
    const validStatuses = ['PENDING', 'IN_PROGRESS', 'COMPLETED'];
    if (!validStatuses.includes(status)) {
        throw new Error("Invalid task status");
    }
}

function validateOverdueReason(reason) {
    if (!reason?.trim()) {
        throw new Error("Overdue reason is required");
    }
}

module.exports = {
    validateCreateTask,
    validateTaskStatus,
    validateOverdueReason
};
