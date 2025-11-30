import { NextResponse } from 'next/server';
import { getFIFOQueue, getMinHeap } from '@/lib/events/queueManager';

export async function GET() {
    try {
        const fifoQueue = getFIFOQueue();
        const minHeap = getMinHeap();

        const fifoEvents = fifoQueue.getAll();

        const heapEvents = minHeap.getAll();

        return NextResponse.json({
            fifo: {
                size: fifoQueue.size(),
                isEmpty: fifoQueue.isEmpty(),
                events: fifoEvents.map(event => ({
                    type: event.type,
                    payload: event.payload,
                    severity: event.severity,
                    createdAt: event.createdAt.toISOString(),
                })),
            },
            heap: {
                size: minHeap.size(),
                isEmpty: minHeap.isEmpty(),
                events: heapEvents.map(event => ({
                    type: event.type,
                    payload: event.payload,
                    severity: event.severity,
                    createdAt: event.createdAt.toISOString(),
                })),
            },
        });
    } catch (error) {
        console.error('Error retrieving events:', error);
        return NextResponse.json(
            { error: 'Failed to retrieve events', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

