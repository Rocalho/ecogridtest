import { Event } from "./types";

export type { Event };

export class FIFOQueue {
    private queue: Event[] = [];

    enqueue(event: Event): void {
        this.queue.push(event);
    }

    dequeue(): Event | undefined {
        return this.queue.shift();
    }

    peek(): Event | undefined {
        return this.queue[0];
    }

    size(): number {
        return this.queue.length;
    }

    isEmpty(): boolean {
        return this.queue.length === 0;
    }

    getAll(): Event[] {
        return [...this.queue];
    }

    clear(): void {
        this.queue = [];
    }
}

export class MinHeap {
    private heap: Event[] = [];

    private getParentIndex(index: number): number {
        return Math.floor((index - 1) / 2);
    }

    private getLeftChildIndex(index: number): number {
        return 2 * index + 1;
    }

    private getRightChildIndex(index: number): number {
        return 2 * index + 2;
    }

    private hasParent(index: number): boolean {
        return this.getParentIndex(index) >= 0;
    }

    private hasLeftChild(index: number): boolean {
        return this.getLeftChildIndex(index) < this.heap.length;
    }

    private hasRightChild(index: number): boolean {
        return this.getRightChildIndex(index) < this.heap.length;
    }

    private getParent(index: number): Event {
        return this.heap[this.getParentIndex(index)];
    }

    private getLeftChild(index: number): Event {
        return this.heap[this.getLeftChildIndex(index)];
    }

    private getRightChild(index: number): Event {
        return this.heap[this.getRightChildIndex(index)];
    }

    private swap(index1: number, index2: number): void {
        [this.heap[index1], this.heap[index2]] = [this.heap[index2], this.heap[index1]];
    }

    private heapifyUp(): void {
        let index = this.heap.length - 1;
        while (
            this.hasParent(index) &&
            this.getParent(index).severity > this.heap[index].severity
        ) {
            const parentIndex = this.getParentIndex(index);
            this.swap(parentIndex, index);
            index = parentIndex;
        }
    }

    private heapifyDown(): void {
        let index = 0;
        while (this.hasLeftChild(index)) {
            let smallerChildIndex = this.getLeftChildIndex(index);

            if (
                this.hasRightChild(index) &&
                this.getRightChild(index).severity < this.getLeftChild(index).severity
            ) {
                smallerChildIndex = this.getRightChildIndex(index);
            }

            if (this.heap[index].severity < this.heap[smallerChildIndex].severity) {
                break;
            }

            this.swap(index, smallerChildIndex);
            index = smallerChildIndex;
        }
    }

    insert(event: Event): void {
        this.heap.push(event);
        this.heapifyUp();
    }

    extractMin(): Event | undefined {
        if (this.heap.length === 0) {
            return undefined;
        }

        if (this.heap.length === 1) {
            return this.heap.pop();
        }

        const min = this.heap[0];
        this.heap[0] = this.heap.pop()!;
        this.heapifyDown();

        return min;
    }

    peek(): Event | undefined {
        return this.heap[0];
    }

    size(): number {
        return this.heap.length;
    }

    isEmpty(): boolean {
        return this.heap.length === 0;
    }

    getAll(): Event[] {
        return [...this.heap].sort((a, b) => a.severity - b.severity);
    }

    clear(): void {
        this.heap = [];
    }
}

