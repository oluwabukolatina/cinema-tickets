import {MockTicketPaymentService} from "./MockTicketPaymentService.mock.js";
import {MockSeatReservationService} from "./MockSeatReservationService.mock.js";
import TicketService from "../src/pairtest/TicketService.js";
import TicketTypeRequest from "../src/pairtest/lib/TicketTypeRequest.js";
import InvalidPurchaseException from "../src/pairtest/lib/InvalidPurchaseException.js";

describe('TicketService', () => {
    let ticketService;
    let mockPaymentService;
    let mockSeatService;

    beforeEach(() => {
        mockPaymentService = new MockTicketPaymentService();
        mockSeatService = new MockSeatReservationService();
        ticketService = new TicketService(mockPaymentService, mockSeatService);
    });

    describe('Valid purchases', () => {
        test('should purchase adult tickets successfully', () => {
            const adultRequest = new TicketTypeRequest('ADULT', 2);

            ticketService.purchaseTickets(1, adultRequest);

            expect(mockPaymentService.payments).toHaveLength(1);
            expect(mockPaymentService.payments[0]).toEqual({ accountId: 1, totalAmountToPay: 50 });
            expect(mockSeatService.reservations).toHaveLength(1);
            expect(mockSeatService.reservations[0]).toEqual({ accountId: 1, totalSeatsToAllocate: 2 });
        });

        test('should purchase mixed tickets successfully', () => {
            const adultRequest = new TicketTypeRequest('ADULT', 2);
            const childRequest = new TicketTypeRequest('CHILD', 2);
            const infantRequest = new TicketTypeRequest('INFANT', 1);

            ticketService.purchaseTickets(1, adultRequest, childRequest, infantRequest);

            expect(mockPaymentService.payments[0]).toEqual({ accountId: 1, totalAmountToPay: 80 });
            expect(mockSeatService.reservations[0]).toEqual({ accountId: 1, totalSeatsToAllocate: 4 });
        });

        test('should handle maximum tickets (25)', () => {
            const adultRequest = new TicketTypeRequest('ADULT', 25);

            ticketService.purchaseTickets(1, adultRequest);

            expect(mockPaymentService.payments[0]).toEqual({ accountId: 1, totalAmountToPay: 625 });
            expect(mockSeatService.reservations[0]).toEqual({ accountId: 1, totalSeatsToAllocate: 25 });
        });

        test('should handle infants correctly (no seats, no payment)', () => {
            const adultRequest = new TicketTypeRequest('ADULT', 2);
            const infantRequest = new TicketTypeRequest('INFANT', 2);

            ticketService.purchaseTickets(1, adultRequest, infantRequest);

            expect(mockPaymentService.payments[0]).toEqual({ accountId: 1, totalAmountToPay: 50 });
            expect(mockSeatService.reservations[0]).toEqual({ accountId: 1, totalSeatsToAllocate: 2 });
        });
    });

    describe('Invalid purchases', () => {
        test('should reject invalid account ID', () => {
            const adultRequest = new TicketTypeRequest('ADULT', 1);

            expect(() => ticketService.purchaseTickets(0, adultRequest))
                .toThrow(InvalidPurchaseException);
            expect(() => ticketService.purchaseTickets(-1, adultRequest))
                .toThrow(InvalidPurchaseException);
            expect(() => ticketService.purchaseTickets(null, adultRequest))
                .toThrow(InvalidPurchaseException);
        });

        test('should reject more than 25 tickets', () => {
            const adultRequest = new TicketTypeRequest('ADULT', 26);

            expect(() => ticketService.purchaseTickets(1, adultRequest))
                .toThrow(InvalidPurchaseException);
        });

        test('should reject child tickets without adult', () => {
            const childRequest = new TicketTypeRequest('CHILD', 1);

            expect(() => ticketService.purchaseTickets(1, childRequest))
                .toThrow(InvalidPurchaseException);
        });

        test('should reject infant tickets without adult', () => {
            const infantRequest = new TicketTypeRequest('INFANT', 1);

            expect(() => ticketService.purchaseTickets(1, infantRequest))
                .toThrow(InvalidPurchaseException);
        });

        test('should reject more infants than adults', () => {
            const adultRequest = new TicketTypeRequest('ADULT', 1);
            const infantRequest = new TicketTypeRequest('INFANT', 2);

            expect(() => ticketService.purchaseTickets(1, adultRequest, infantRequest))
                .toThrow(InvalidPurchaseException);
        });

        test('should reject empty ticket requests', () => {
            expect(() => ticketService.purchaseTickets(1))
                .toThrow(InvalidPurchaseException);
        });

        test('should reject invalid ticket types', () => {
            expect(() => new TicketTypeRequest('SENIOR', 1))
                .toThrow(TypeError);
        });

        test('should reject zero or negative ticket quantities', () => {
            const zeroRequest = new TicketTypeRequest('ADULT', 0);
            const negativeRequest = new TicketTypeRequest('ADULT', -1);

            expect(() => ticketService.purchaseTickets(1, zeroRequest))
                .toThrow(InvalidPurchaseException);
            expect(() => ticketService.purchaseTickets(1, negativeRequest))
                .toThrow(InvalidPurchaseException);
        });
    });

    describe('Edge cases', () => {
        test('should handle multiple ticket requests of same type', () => {
            const adultRequest1 = new TicketTypeRequest('ADULT', 2);
            const adultRequest2 = new TicketTypeRequest('ADULT', 3);

            ticketService.purchaseTickets(1, adultRequest1, adultRequest2);

            expect(mockPaymentService.payments[0]).toEqual({ accountId: 1, totalAmountToPay: 125 });
            expect(mockSeatService.reservations[0]).toEqual({ accountId: 1, totalSeatsToAllocate: 5 });
        });

        test('should handle complex mixed scenario within limits', () => {
            const adultRequest = new TicketTypeRequest('ADULT', 10);
            const childRequest = new TicketTypeRequest('CHILD', 10);
            const infantRequest = new TicketTypeRequest('INFANT', 5);

            ticketService.purchaseTickets(1, adultRequest, childRequest, infantRequest);

            expect(mockPaymentService.payments[0]).toEqual({ accountId: 1, totalAmountToPay: 400 });
            expect(mockSeatService.reservations[0]).toEqual({ accountId: 1, totalSeatsToAllocate: 20 });
        });
    });
});