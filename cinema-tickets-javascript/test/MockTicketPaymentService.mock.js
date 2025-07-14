export class MockTicketPaymentService {
    constructor() {
        this.payments = [];
    }

    makePayment(accountId, totalAmountToPay) {
        this.payments.push({ accountId, totalAmountToPay });
    }
}