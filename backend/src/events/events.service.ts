import { Injectable } from '@nestjs/common';
import { Subject } from 'rxjs';

export interface OrderStatusEvent {
  orderId: string;
  status: string;
  note?: string;
  updatedAt: Date;
}

@Injectable()
export class EventsService {
  // Map buyerId → Subject so each buyer gets their own stream
  private readonly streams = new Map<string, Subject<OrderStatusEvent>>();

  getStream(buyerId: string): Subject<OrderStatusEvent> {
    if (!this.streams.has(buyerId)) {
      this.streams.set(buyerId, new Subject<OrderStatusEvent>());
    }
    return this.streams.get(buyerId)!;
  }

  emit(buyerId: string, event: OrderStatusEvent) {
    this.streams.get(buyerId)?.next(event);
  }

  removeStream(buyerId: string) {
    const subject = this.streams.get(buyerId);
    if (subject) {
      subject.complete();
      this.streams.delete(buyerId);
    }
  }
}
