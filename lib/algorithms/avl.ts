export class AVLNode {
    key: number;
    value: any;
    left: AVLNode | null;
    right: AVLNode | null;
    height: number;

    constructor(key: number, value: any) {
        this.key = key;
        this.value = value;
        this.left = null;
        this.right = null;
        this.height = 1;
    }
}

export class AVLTree {
    root: AVLNode | null;
    private operations: number;

    constructor() {
        this.root = null;
        this.operations = 0;
    }

    getOperations(): number {
        return this.operations;
    }

    resetOperations(): void {
        this.operations = 0;
    }

    private getHeight(node: AVLNode | null): number {
        this.operations++;
        return node ? node.height : 0;
    }

    private getBalance(node: AVLNode | null): number {
        this.operations++;
        if (!node) return 0;
        return this.getHeight(node.left) - this.getHeight(node.right);
    }

    private rightRotate(y: AVLNode): AVLNode {
        this.operations++;
        const x = y.left!;
        const T2 = x.right;

        x.right = y;
        y.left = T2;

        y.height = Math.max(this.getHeight(y.left), this.getHeight(y.right)) + 1;
        x.height = Math.max(this.getHeight(x.left), this.getHeight(x.right)) + 1;

        return x;
    }

    private leftRotate(x: AVLNode): AVLNode {
        this.operations++;
        const y = x.right!;
        const T2 = y.left;

        y.left = x;
        x.right = T2;

        x.height = Math.max(this.getHeight(x.left), this.getHeight(x.right)) + 1;
        y.height = Math.max(this.getHeight(y.left), this.getHeight(y.right)) + 1;

        return y;
    }

    insert(key: number, value: any): void {
        this.root = this.insertNode(this.root, key, value);
    }

    private insertNode(node: AVLNode | null, key: number, value: any): AVLNode {
        this.operations++;

        if (!node) {
            return new AVLNode(key, value);
        }

        if (key < node.key) {
            node.left = this.insertNode(node.left, key, value);
        } else if (key > node.key) {
            node.right = this.insertNode(node.right, key, value);
        } else {
            node.value = value;
            return node;
        }

        node.height = 1 + Math.max(this.getHeight(node.left), this.getHeight(node.right));

        const balance = this.getBalance(node);

        if (balance > 1 && key < node.left!.key) {
            return this.rightRotate(node);
        }

        if (balance < -1 && key > node.right!.key) {
            return this.leftRotate(node);
        }

        if (balance > 1 && key > node.left!.key) {
            node.left = this.leftRotate(node.left!);
            return this.rightRotate(node);
        }

        if (balance < -1 && key < node.right!.key) {
            node.right = this.rightRotate(node.right!);
            return this.leftRotate(node);
        }

        return node;
    }

    search(key: number): any | null {
        return this.searchNode(this.root, key);
    }

    private searchNode(node: AVLNode | null, key: number): any | null {
        this.operations++;

        if (!node) {
            return null;
        }

        if (key === node.key) {
            return node.value;
        }

        if (key < node.key) {
            return this.searchNode(node.left, key);
        }

        return this.searchNode(node.right, key);
    }
}

