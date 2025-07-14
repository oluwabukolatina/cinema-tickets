export class MockSeatReservationService {
    constructor() {
        this.reservations = [];
    }

    reserveSeat(accountId, totalSeatsToAllocate) {
        this.reservations.push({ accountId, totalSeatsToAllocate });
    }
}