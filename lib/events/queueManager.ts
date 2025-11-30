import { FIFOQueue, MinHeap, Event } from '@/lib/events';

let fifoQueueInstance: FIFOQueue | null = null;
let minHeapInstance: MinHeap | null = null;

export function getFIFOQueue(): FIFOQueue {
    if (!fifoQueueInstance) {
        fifoQueueInstance = new FIFOQueue();
    }
    return fifoQueueInstance;
}

export function getMinHeap(): MinHeap {
    if (!minHeapInstance) {
        minHeapInstance = new MinHeap();
    }
    return minHeapInstance;
}

export function addEvent(event: Event): void {
    const fifo = getFIFOQueue();
    const heap = getMinHeap();

    const heapEvent: Event = {
        ...event,
        createdAt: new Date(event.createdAt)
    };

    fifo.enqueue(event);
    heap.insert(heapEvent);
}

export function resetQueues(): void {
    if (fifoQueueInstance) {
        fifoQueueInstance.clear();
    }
    if (minHeapInstance) {
        minHeapInstance.clear();
    }
}

