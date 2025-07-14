import TicketTypeRequest from './lib/TicketTypeRequest.js';
import InvalidPurchaseException from './lib/InvalidPurchaseException.js';

export default class TicketService {
  constructor(ticketPaymentService, seatReservationService) {
    this.#ticketPaymentService = ticketPaymentService;
    this.#seatReservationService = seatReservationService;
  }
  #ticketPaymentService;
  #seatReservationService;
  /**
   * Should only have private methods other than the one below.
   */

  purchaseTickets(accountId, ...ticketTypeRequests) {
    this.#validateAccountId(accountId);

    this.#validateTicketRequests(ticketTypeRequests);

    const { totalCost, totalSeats, ticketCounts } = this.#calculateTotals(ticketTypeRequests);

    this.#validateBusinessRules(ticketCounts, totalSeats);

    this.#ticketPaymentService.makePayment(accountId, totalCost);

    this.#seatReservationService.reserveSeat(accountId, totalSeats);
  }

  #validateAccountId(accountId) {
    if (!Number.isInteger(accountId) || accountId <= 0) {
      throw new InvalidPurchaseException('Account id must be greater than zero');
    }
  }

  #validateTicketRequests(ticketTypeRequests) {
    if (!ticketTypeRequests || ticketTypeRequests.length === 0) {
      throw new InvalidPurchaseException('Invalid ticket purchase request');
    }

    for (const request of ticketTypeRequests) {
      if (!request || typeof request.getTicketType !== 'function' || typeof request.getNoOfTickets !== 'function') {
        throw new InvalidPurchaseException('Invalid ticket purchase request');
      }

      if (!Number.isInteger(request.getNoOfTickets()) || request.getNoOfTickets() <= 0) {
        throw new InvalidPurchaseException('Invalid ticket purchase request');
      }
    }
  }

  #calculateTotals(ticketTypeRequests) {
    const TICKET_PRICES = {
      INFANT: 0,
      CHILD: 15,
      ADULT: 25
    };

    let totalCost = 0;
    let totalSeats = 0;
    const ticketCounts = {
      INFANT: 0,
      CHILD: 0,
      ADULT: 0
    };

    for (const request of ticketTypeRequests) {
      const ticketType = request.getTicketType();
      const noOfTickets = request.getNoOfTickets();

      if (!TICKET_PRICES.hasOwnProperty(ticketType)) {
        throw new InvalidPurchaseException('Invalid ticket type. Only Infant, Child, and Adult tickets are available');
      }

      ticketCounts[ticketType] += noOfTickets;
      totalCost += TICKET_PRICES[ticketType] * noOfTickets;

      if (ticketType !== 'INFANT') {
        totalSeats += noOfTickets;
      }
    }

    return { totalCost, totalSeats, ticketCounts };
  }

  #validateBusinessRules(ticketCounts) {
    const totalTickets = ticketCounts.INFANT + ticketCounts.CHILD + ticketCounts.ADULT;

    if (totalTickets > 25) {
      throw new InvalidPurchaseException('Maximum of 25 tickets can be purchased at a time');
    }

    if ((ticketCounts.CHILD > 0 || ticketCounts.INFANT > 0) && ticketCounts.ADULT === 0) {
      throw new InvalidPurchaseException('Child and Infant tickets cannot be purchased without purchasing an Adult ticket');
    }

    if (ticketCounts.INFANT > ticketCounts.ADULT) {
      throw new InvalidPurchaseException('Each Infant must have an Adult ticket as they will be sitting on an Adult\'s lap');
    }
  }
}