import { Injectable } from '@nestjs/common';
import { ReplaySubject } from 'rxjs';

export interface OrderStatusEvent {
  orderId: string;
  status: string;
  note?: string;
  updatedAt: Date;
}

@Injectable()
export class EventsService {
  // ReplaySubject(10) buffers last 10 events so late SSE subscribers don't miss events
  // emitted between page load and SSE connection establishment
  private readonly streams = new Map<string, ReplaySubject<OrderStatusEvent>>();

  getStream(buyerId: string): ReplaySubject<OrderStatusEvent> {
    if (!this.streams.has(buyerId)) {
      this.streams.set(buyerId, new ReplaySubject<OrderStatusEvent>(10));
    }
    return this.streams.get(buyerId)!;
  }

  emit(buyerId: string, event: OrderStatusEvent) {
    // Create stream if buyer isn't connected yet — event will be buffered and replayed on connect
    this.getStream(buyerId).next(event);
  }

  removeStream(buyerId: string) {
    const subject = this.streams.get(buyerId);
    if (subject) {
      subject.complete();
      this.streams.delete(buyerId);
    }
  }
}
