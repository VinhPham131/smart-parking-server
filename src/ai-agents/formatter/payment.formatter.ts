export function formatPaymentList(result: any) {
    return {
        type: 'list',
        list_type: 'payment',
        meta: {
            total: result.total
        },
        items: result.payments.map((payment: any) => ({
            id: payment.id,
            user: payment.user,
            amount: payment.amount,
            description: payment.description,
            payment_type: payment.payment_type,
            status: payment.status,
        })),
    }
}

export function formatPaymentsByType(result: any) {
    return {
        type: 'list',
        list_type: 'payment',
        meta: {
            total: result.total
        },
        items: result.payments.map((payment: any) => ({
            id: payment.id,
            user: payment.user,
            amount: payment.amount,
            description: payment.description,
            payment_type: payment.payment_type,
            status: payment.status,
        })),
    }
}

export function formatPaymentsByStatus(result: any) {
    return {
        type: 'list',
        list_type: 'payment',
        meta: {
            total: result.total
        },
        items: result.payments.map((payment: any) => ({
            id: payment.id,
            user: payment.user,
            amount: payment.amount,
            description: payment.description,
            payment_type: payment.payment_type,
            status: payment.status,
        })),
    }
}

export function formatPaymentsByUserName(result: any) {
    return {
        type: 'list',
        list_type: 'payment',
        meta: {
            total: result.total
        },
        items: result.payments.map((payment: any) => ({
            id: payment.id,
            user: payment.user,
            amount: payment.amount,
            description: payment.description,
            payment_type: payment.payment_type,
            status: payment.status,
        })),
    }
}


export function formatRevenueByDay(result: any) {
    return {
        type: 'message',
        content: `The revenue difference between today and the previous day is ${result.revenueDifference} VND.`,
    };
}

export function formatRevenueByMonth(result: any) {
    return {
        type: 'message',
        content: `The revenue difference between this month and the previous month is ${result.revenueDifference} VND.`,
    };
}

export function formatRevenueByYear(result: any) {
    return {
        type: 'message',
        content: `The revenue difference between this year and the previous year is ${result.revenueDifference} VND.`,
    };
}