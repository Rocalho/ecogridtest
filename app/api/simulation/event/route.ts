import { NextRequest, NextResponse } from 'next/server';
import { addEvent, getFIFOQueue } from '@/lib/events/queueManager';
import { Event } from '@/lib/events';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        if (!body.type || typeof body.type !== 'string') {
            return NextResponse.json(
                { error: 'Missing or invalid field: type (string required)' },
                { status: 400 }
            );
        }

        if (!body.payload || typeof body.payload !== 'object') {
            return NextResponse.json(
                { error: 'Missing or invalid field: payload (object required)' },
                { status: 400 }
            );
        }

        if (body.severity === undefined || typeof body.severity !== 'number') {
            return NextResponse.json(
                { error: 'Missing or invalid field: severity (number 0-5 required)' },
                { status: 400 }
            );
        }

        if (body.severity < 0 || body.severity > 5) {
            return NextResponse.json(
                { error: 'Severity must be between 0 and 5' },
                { status: 400 }
            );
        }

        const event: Event = {
            type: body.type,
            payload: body.payload,
            severity: body.severity,
            createdAt: body.createdAt ? new Date(body.createdAt) : new Date(),
        };

        addEvent(event);

        const fifoQueue = getFIFOQueue();

        return NextResponse.json({
            success: true,
            message: 'Event added to FIFO queue',
            event: {
                type: event.type,
                severity: event.severity,
                createdAt: event.createdAt.toISOString(),
            },
            queueSize: fifoQueue.size(),
        });
    } catch (error) {
        console.error('Error adding event:', error);
        return NextResponse.json(
            { error: 'Failed to add event', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}

